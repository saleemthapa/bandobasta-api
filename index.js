require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render-hosted PostgreSQL
  },
});

app.use(cors());
app.use(express.json());

// API Endpoint to Get Venues with Associated Images
app.get("/venue/findall", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id AS venue_id,
        v.is_verified,
        v.menu_price,
        v.venue_name,
        v.email,
        v.address,
        v.description,
        vi.image_url
      FROM public.venue AS v
      LEFT JOIN public.venue_image AS vi ON v.id = vi.venue_id;
    `);

    // Group venue details and associated images
    const venues = result.rows.reduce((acc, row) => {
      let venue = acc.find(v => v.venue_id === row.venue_id);
      if (!venue) {
        venue = {
          venue_id: row.venue_id,
          is_verified: row.is_verified,
          menu_price: row.menu_price,
          venue_name: row.venue_name,
          email: row.email,
          address: row.address,
          description: row.description,
          images: [],  // Initialize an empty array for images
        };
        acc.push(venue);
      }
      if (row.image_url) {
        venue.images.push(row.image_url);  // Add image URL to the images array
      }
      return acc;
    }, []);

    res.json({
      success: true,
      venues: venues,
    });
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
