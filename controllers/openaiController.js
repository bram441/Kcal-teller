const OpenAI = require("openai");
const pool = require("../config/db");
const cloudinary = require("../utils/cloudinary");
const { sequelize, Sequelize } = require("../config/db");
const { QueryTypes } = require("sequelize");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Clean numeric strings like "<0.5 g", "25g", "25,0", etc.
const sanitize = (val) => {
  if (!val) return 0;
  if (typeof val === "string" && val.includes("<")) return 0;
  const cleaned = val
    .toString()
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const extractNutritionInfo = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "nutrition_images",
      resource_type: "image", // Accepts both PNG and JPG
    });

    const publicImageUrl = uploadResponse.secure_url;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Je krijgt een afbeelding van een voedingswaardetabel van een voedingsproduct (meestal in het Nederlands).

Haal zoveel mogelijk van de volgende informatie uit de afbeelding:

Verplicht indien beschikbaar:
- product_name: de naam van het product
- kcal_per_100: kilocalorieën per 100g/ml
- proteine_per_100: eiwitten per 100g/ml
- fats_per_100: vetten per 100g/ml
- sugar_per_100: suikers per 100g/ml, meer specifiek gaat het over de koolhydraten in het totaal, niet enkel waarvan suikers

Indien aanwezig op de afbeelding:
- grams_per_portion: gewicht van een portie (bv. 150g)
- kcal_per_portion: kcal per portie
- portion_description: beschrijving van de portie (bv. "1 burger", "1 stuk", "1 verpakking")
- brand: het merk van het product
- tags: een lijst van maximaal 3 relevante categorieën (zoals "vlees", "vegetarisch", "drinken", "zuivel", "snack", "ontbijt")

Geef uitsluitend een JSON-terug met de volgende velden:
product_name, brand, kcal_per_100, proteine_per_100, fats_per_100, sugar_per_100, grams_per_portion, kcal_per_portion, portion_description, tags

Gebruik null voor elk veld dat niet op de afbeelding te vinden is. Geef geen uitleg of extra tekst.
              `,
            },
            {
              type: "image_url",
              image_url: {
                url: publicImageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 600,
    });

    const raw = response.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      const match = raw.match(/{[\s\S]*}/);
      if (!match) {
        throw new Error("No JSON found in GPT response");
      }
      parsed = JSON.parse(match[0]);
    }

    // Final cleaned object
    const cleanData = {
      product_name: parsed.product_name || "Onbekend product",
      brand: parsed.brand || null,
      kcal_per_100: sanitize(parsed.kcal_per_100),
      proteine_per_100: sanitize(parsed.proteine_per_100),
      fats_per_100: sanitize(parsed.fats_per_100),
      sugar_per_100: sanitize(parsed.sugar_per_100),
      grams_per_portion: sanitize(parsed.grams_per_portion),
      kcal_per_portion: sanitize(parsed.kcal_per_portion),
      portion_description: parsed.portion_description || null,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => t.toLowerCase().trim()).slice(0, 3)
        : [],
    };

    res.json(cleanData);
  } catch (error) {
    console.error("OpenAI extraction failed:", error.message);
    res.status(500).json({ error: "Failed to extract nutrition info" });
  }
};

const normalizeText = (text) => {
  return text.toLowerCase().replace(/[-()]/g, "").replace(/\s+/g, " ").trim();
};

const sanitizeMatch = (val) => {
  if (!val) return null;
  const cleaned = val
    .toString()
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const extractQuantityAndName = (name) => {
  const match = name.match(/^(\d+)\s+(.*)$/);
  if (match) {
    return {
      quantity: parseInt(match[1]),
      name: match[3].trim(),
    };
  }
  return { quantity: 1, name };
};

const findClosestFoodMatch = async (name) => {
  const normalizedInput = normalizeText(name);

  try {
    const candidates = await sequelize.query(
      `SELECT *, similarity(lower(regexp_replace(name, '[^a-z0-9 ]', '', 'g')), :normalizedInput) AS sim
       FROM "Food"
       WHERE similarity(lower(regexp_replace(name, '[^a-z0-9 ]', '', 'g')), :normalizedInput) > 0.3
          OR lower(name) LIKE '%' || :likeInput || '%'
       ORDER BY sim DESC
       LIMIT 5`,
      {
        replacements: { normalizedInput, likeInput: normalizedInput },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!candidates || candidates.length === 0) {
      return { match: null, candidates: [], status: "no match" };
    }

    const strongMatches = candidates.filter((c) => c.sim >= 0.7);

    if (strongMatches.length === 1) {
      return { match: strongMatches[0], candidates: [], status: "matched" };
    }

    if (candidates.length === 1) {
      return { match: candidates[0], candidates: [], status: "matched" };
    }

    return { match: null, candidates, status: "ambiguous_match" };
  } catch (err) {
    console.error("DB match error:", err);
    return { match: null, candidates: [], status: "error" };
  }
};

const analyzeIntake = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a calorie tracking assistant. The user will describe what they ate today in natural language, often in Dutch.

Return an array of JSON objects. Each object should have:
- name: name of the food
- type: one of [ochtend, middag, avond, snack, drinken] (based on meal context or time)
- portion_description: what was eaten (e.g. "1 boterham met kaas")
- grams: grams or mililiters of food/drinks (if not available don't estimate, set to null)
- quantity: quantity of food (if not available, set to null), this could also be in the form of "1 portie", "1 stuk", "1 glas", "1 blikje", etc.
- kcal: estimated kilocalories
- proteins: estimated grams of protein
- fats: estimated grams of fat
- sugar: estimated grams of sugar

Always output only the array in JSON format. If values must be guessed, do so conservatively.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 1000,
    });

    const raw = response.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      const match = raw.match(/\[.*\]/s);
      if (!match) {
        throw new Error("No JSON array found in GPT response");
      }
      parsed = JSON.parse(match[0]);
    }

    const enriched = await Promise.all(
      parsed.map(async (item) => {
        console.log("Item:", item);
        const { quantity1, name } = extractQuantityAndName(item.name);
        const { match, candidates, status } = await findClosestFoodMatch(name);

        if (status === "matched") {
          let grams = null;
          if (item.quantity && match.grams_per_portion) {
            grams = match.grams_per_portion * item.quantity;
          } else if (item.grams != null) {
            grams = sanitizeMatch(item.grams);
          }
          return {
            input_name: item.name,
            portion_description:
              match.portion_description || item.portion_description || null,
            grams: grams,
            kcal: match.kcal_per_100,
            proteins: match.proteine_per_100,
            fats: match.fats_per_100,
            sugar: match.sugar_per_100,
            type: item.type || "onbekend",
            match,
            candidates: [],
            status: inferredGrams == null ? "missing_quantity" : "matched",
          };
        } else if (status === "ambiguous_match") {
          return {
            input_name: item.name,
            portion_description: item.portion_description || null,
            grams: sanitizeMatch(item.grams) || null,
            quantity: sanitizeMatch(item.quantity) || null,
            kcal: null,
            proteins: null,
            fats: null,
            sugar: null,
            type: item.type || "onbekend",
            match: null,
            candidates,
            status: "ambiguous_match",
          };
        } else {
          return {
            input_name: item.name,
            portion_description: item.portion_description || null,
            grams,
            kcal: sanitizeMatch(item.kcal),
            proteins: sanitizeMatch(item.proteins),
            fats: sanitizeMatch(item.fats),
            sugar: sanitizeMatch(item.sugar),
            type: item.type || "onbekend",
            match: null,
            candidates: [],
            status: grams == null ? "missing_quantity" : "no match",
          };
        }
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("Failed to analyze food intake:", error);
    res.status(500).json({ error: "Failed to analyze food intake." });
  }
};
module.exports = { extractNutritionInfo, analyzeIntake };
