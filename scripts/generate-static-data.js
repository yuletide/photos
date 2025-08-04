#!/usr/bin/env node

const { createFlickr } = require('flickr-sdk');
const fs = require('fs');
const path = require('path');

// Configuration from galleries.ts (duplicated here to avoid TS compilation)
const galleryConfig = [
  {
    name: 'Travel',
    slug: 'travel',
    photosetIds: [
      '72157673637437610',
      '72177720327261716', 
      '72157613054729173',
    ],
  },
  {
    name: 'Concerts',
    slug: 'concerts',
    photosetIds: [
      '72177720327288509',
      '72177720316800271',
    ],
  },
  {
    name: 'Best Of',
    slug: 'best-of',
    photosetIds: [
      '72157603655578863',
    ],
  },
];

const filterPhotosetsByConfig = (photosets, categorySlug) => {
  let allowedIds;

  if (categorySlug) {
    const category = galleryConfig.find((c) => c.slug === categorySlug);
    allowedIds = category ? category.photosetIds : [];
  } else {
    // If no category, get all unique IDs from the config
    allowedIds = [
      ...new Set(galleryConfig.flatMap((category) => category.photosetIds)),
    ];
  }

  const photosetMap = new Map(photosets.map((set) => [set.id, set]));

  // Return the photosets in the order they are defined in the config
  return allowedIds
    .map((id) => photosetMap.get(id))
    .filter((set) => set !== undefined);
};

async function generateStaticData() {
  const API_KEY = process.env.FLICKR_API_KEY;
  const USER_ID = process.env.FLICKR_USER_ID;

  if (!API_KEY || !USER_ID) {
    console.error('FLICKR_API_KEY and FLICKR_USER_ID environment variables are required');
    process.exit(1);
  }

  const { flickr } = createFlickr(API_KEY);
  const dataDir = path.join(__dirname, '../src/data');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    console.log('Fetching photosets from Flickr...');
    
    // Fetch all photosets
    const photosetsRes = await flickr('flickr.photosets.getList', {
      user_id: USER_ID,
      primary_photo_extras: 'url_m',
    });

    const allPhotosets = photosetsRes.photosets.photoset;
    console.log(`Found ${allPhotosets.length} total photosets`);

    // Filter photosets by config for main list
    const filteredPhotosets = filterPhotosetsByConfig(allPhotosets);
    console.log(`Filtered to ${filteredPhotosets.length} configured photosets`);

    // Save main photosets data
    fs.writeFileSync(
      path.join(dataDir, 'photosets.json'),
      JSON.stringify(filteredPhotosets, null, 2)
    );

    // Generate category-specific photosets
    for (const category of galleryConfig) {
      const categoryPhotosets = filterPhotosetsByConfig(allPhotosets, category.slug);
      fs.writeFileSync(
        path.join(dataDir, `photosets-${category.slug}.json`),
        JSON.stringify(categoryPhotosets, null, 2)
      );
      console.log(`Generated ${category.name} category with ${categoryPhotosets.length} photosets`);
    }

    // Fetch photos for each photoset
    const photosDir = path.join(dataDir, 'photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    for (const photoset of filteredPhotosets) {
      console.log(`Fetching photos for photoset: ${photoset.title._content}`);
      
      try {
        const photosRes = await flickr('flickr.photosets.getPhotos', {
          photoset_id: photoset.id,
          user_id: USER_ID,
          extras: 'url_m,url_l,url_o,description',
        });

        fs.writeFileSync(
          path.join(photosDir, `${photoset.id}.json`),
          JSON.stringify(photosRes.photoset.photo, null, 2)
        );
        
        console.log(`Saved ${photosRes.photoset.photo.length} photos for photoset ${photoset.id}`);
      } catch (error) {
        console.warn(`Failed to fetch photos for photoset ${photoset.id}:`, error.message);
      }
      
      // Add small delay to be respectful to Flickr API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Static data generation complete!');
    console.log(`Data saved to: ${dataDir}`);
    
  } catch (error) {
    console.error('❌ Failed to generate static data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  generateStaticData();
}

module.exports = { generateStaticData };