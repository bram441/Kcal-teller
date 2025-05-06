const OpenAI = require("openai");
const cloudinary = require("../utils/cloudinary");

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

module.exports = { extractNutritionInfo };
