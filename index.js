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
        v.owner_id,
        v.country_code,
        v.primary_phone_number,
        v.secondary_phone_number,
        v.license_number,
        v.registration_number,
        v.status,
        v.venue_name,
        v.email,
        v.address,
        v.description,
        v.license_image_url,
        v.pan_image_url,
        v.permanent_account_number,
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
          owner_id: row.owner_id,
          country_code: row.country_code,
          primary_phone_number: row.primary_phone_number,
          secondary_phone_number: row.secondary_phone_number,
          license_number: row.license_number,
          registration_number: row.registration_number,
          status: row.status,
          venue_name: row.venue_name,
          email: row.email,
          address: row.address,
          description: row.description,
          license_image_url: row.license_image_url,
          pan_image_url: row.pan_image_url,
          permanent_account_number: row.permanent_account_number,
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
