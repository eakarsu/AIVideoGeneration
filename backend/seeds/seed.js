const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_video_generation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

if(process.env.ALLOW_DESTRUCTIVE_DEMO_SEED!=='true'){console.error('Refusing destructive demo seed; set ALLOW_DESTRUCTIVE_DEMO_SEED=true only for an isolated disposable database.');process.exit(2);}
async function seed() {
  console.log('Seeding database...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255), role VARCHAR(50) DEFAULT 'admin', tenant_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS video_projects (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, resolution VARCHAR(50) DEFAULT '1920x1080',
      fps INT DEFAULT 24, duration_seconds INT DEFAULT 10, status VARCHAR(50) DEFAULT 'draft',
      style VARCHAR(100) DEFAULT 'cinematic', aspect_ratio VARCHAR(20) DEFAULT '16:9',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS text_to_video (
      id SERIAL PRIMARY KEY, prompt TEXT NOT NULL, negative_prompt TEXT, duration_seconds INT DEFAULT 4,
      resolution VARCHAR(50) DEFAULT '1280x720', fps INT DEFAULT 24, style VARCHAR(100) DEFAULT 'cinematic',
      model VARCHAR(255) DEFAULT 'stable-video-diffusion', status VARCHAR(50) DEFAULT 'pending',
      output_url TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS image_to_video (
      id SERIAL PRIMARY KEY, name VARCHAR(255), image_url TEXT, motion_prompt TEXT,
      duration_seconds INT DEFAULT 4, motion_strength FLOAT DEFAULT 0.7,
      model VARCHAR(255) DEFAULT 'stable-video-diffusion', status VARCHAR(50) DEFAULT 'pending',
      output_url TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS video_templates (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, category VARCHAR(100),
      resolution VARCHAR(50), duration_seconds INT, style VARCHAR(100), thumbnail_url TEXT,
      config JSONB DEFAULT '{}', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS storyboards (
      id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, project_id INT,
      scenes JSONB DEFAULT '[]', status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS scenes (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, project_id INT,
      scene_order INT DEFAULT 1, duration_seconds INT DEFAULT 5, prompt TEXT,
      transition_in VARCHAR(50) DEFAULT 'fade', transition_out VARCHAR(50) DEFAULT 'fade',
      camera_motion VARCHAR(100) DEFAULT 'static',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS media_library (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, type VARCHAR(50) DEFAULT 'video',
      url TEXT, file_size VARCHAR(50), duration_seconds INT, resolution VARCHAR(50),
      format VARCHAR(20) DEFAULT 'mp4', tags JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS transitions (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, type VARCHAR(50) DEFAULT 'fade',
      duration_ms INT DEFAULT 500, easing VARCHAR(50) DEFAULT 'ease-in-out', description TEXT,
      preview_url TEXT, config JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS audio_tracks (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, type VARCHAR(50) DEFAULT 'music',
      url TEXT, duration_seconds INT, bpm INT, genre VARCHAR(100), mood VARCHAR(100),
      license VARCHAR(100) DEFAULT 'royalty-free',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS video_styles (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, prompt_modifier TEXT,
      negative_prompt TEXT, preview_url TEXT, category VARCHAR(100) DEFAULT 'artistic',
      config JSONB DEFAULT '{}', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS render_queue (
      id SERIAL PRIMARY KEY, project_name VARCHAR(255), resolution VARCHAR(50) DEFAULT '1920x1080',
      format VARCHAR(20) DEFAULT 'mp4', quality VARCHAR(50) DEFAULT 'high',
      status VARCHAR(50) DEFAULT 'queued', progress INT DEFAULT 0,
      estimated_time VARCHAR(50), output_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS export_presets (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, format VARCHAR(20) DEFAULT 'mp4',
      codec VARCHAR(50) DEFAULT 'h264', resolution VARCHAR(50) DEFAULT '1920x1080',
      bitrate VARCHAR(50) DEFAULT '8000k', fps INT DEFAULT 24, quality VARCHAR(50) DEFAULT 'high',
      description TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_prompts (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, prompt TEXT, negative_prompt TEXT,
      category VARCHAR(100) DEFAULT 'general', style VARCHAR(100) DEFAULT 'cinematic',
      tags JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY, key VARCHAR(255) UNIQUE, value TEXT, category VARCHAR(100),
      description TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY, title VARCHAR(255), model VARCHAR(255), status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id SERIAL PRIMARY KEY, conversation_id INT REFERENCES conversations(id),
      role VARCHAR(50), content TEXT, created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Users
  const demoEmail = process.env.SEED_ADMIN_EMAIL || process.env.DEMO_EMAIL;
  const demoPassword = process.env.SEED_ADMIN_PASSWORD || process.env.DEMO_PASSWORD;
  const tenantId = process.env.SEED_TENANT_ID || process.env.GOVERNANCE_TENANT_ID;
  if (!demoEmail || !demoPassword || demoPassword.length < 12 || !tenantId) {
    throw new Error('SEED_ADMIN_EMAIL, a 12+ character SEED_ADMIN_PASSWORD, and SEED_TENANT_ID are required');
  }
  const hash = await bcrypt.hash(demoPassword, 12);
  await pool.query('DELETE FROM users');
  await pool.query('INSERT INTO users (email, password_hash, name, role, tenant_id) VALUES ($1,$2,$3,$4,$5)', [demoEmail, hash, 'Admin User', 'admin', tenantId]);

  // Video Projects (15)
  await pool.query('DELETE FROM video_projects');
  const projects = [
    ['Sunset Timelapse', 'Beautiful sunset over ocean with dramatic clouds', '3840x2160', 30, 60, 'completed', 'cinematic', '16:9'],
    ['Product Launch Promo', 'Tech product reveal with dynamic camera work', '1920x1080', 30, 30, 'in_progress', 'commercial', '16:9'],
    ['Music Video - Neon Dreams', 'Cyberpunk-style music video with neon lighting', '1920x1080', 24, 180, 'draft', 'cyberpunk', '16:9'],
    ['Nature Documentary Intro', 'Sweeping aerial shots of mountain landscapes', '3840x2160', 24, 45, 'completed', 'documentary', '21:9'],
    ['Fashion Lookbook', 'High-fashion editorial style video lookbook', '1080x1920', 30, 60, 'in_progress', 'editorial', '9:16'],
    ['Sci-Fi Short Film', 'Space exploration scene with astronaut', '2560x1440', 24, 120, 'draft', 'sci-fi', '16:9'],
    ['Real Estate Tour', 'Luxury property virtual walkthrough', '3840x2160', 30, 90, 'completed', 'architectural', '16:9'],
    ['Wedding Highlight', 'Romantic wedding ceremony highlights', '1920x1080', 24, 180, 'rendering', 'romantic', '16:9'],
    ['Food Commercial', 'Gourmet cooking process with close-ups', '1920x1080', 60, 30, 'in_progress', 'commercial', '16:9'],
    ['Travel Vlog Intro', 'Dynamic montage of travel destinations', '1920x1080', 30, 15, 'completed', 'travel', '16:9'],
    ['Fitness App Promo', 'Athletic movements with slow motion', '1080x1920', 60, 30, 'draft', 'sports', '9:16'],
    ['Abstract Art Animation', 'Flowing abstract shapes and colors', '1920x1080', 30, 20, 'completed', 'abstract', '16:9'],
    ['Corporate Presentation', 'Professional company overview video', '1920x1080', 30, 120, 'in_progress', 'corporate', '16:9'],
    ['Horror Short - The Mirror', 'Atmospheric horror scene with shadows', '2560x1440', 24, 90, 'draft', 'horror', '2.39:1'],
    ['Social Media Ad Pack', 'Multi-format social media advertisements', '1080x1080', 30, 15, 'queued', 'commercial', '1:1'],
  ];
  for (const p of projects) {
    await pool.query('INSERT INTO video_projects (name,description,resolution,fps,duration_seconds,status,style,aspect_ratio) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', p);
  }

  // Text-to-Video (15)
  await pool.query('DELETE FROM text_to_video');
  const t2v = [
    ['A golden retriever running through a field of sunflowers at sunset, cinematic slow motion, warm golden light', 'blurry, distorted, ugly, low quality', 4, '1280x720', 24, 'cinematic', 'zeroscope-v2', 'completed'],
    ['Futuristic city skyline at night with flying cars and neon holographic advertisements', 'daylight, rural, empty', 4, '1280x720', 24, 'cyberpunk', 'animatediff', 'completed'],
    ['Ocean waves crashing on rocks during a thunderstorm, dramatic lighting', 'calm, sunny, clear sky', 6, '1920x1080', 24, 'dramatic', 'stable-video-diffusion', 'completed'],
    ['A cup of coffee being poured with steam rising, macro close-up shot', 'blurry, dark, shaky', 3, '1280x720', 30, 'commercial', 'zeroscope-v2', 'processing'],
    ['Astronaut floating in space with Earth in the background, stars twinkling', 'ground, indoor, terrestrial', 4, '1280x720', 24, 'sci-fi', 'stable-video-diffusion', 'pending'],
    ['Cherry blossoms falling in slow motion, traditional Japanese garden', 'winter, dead trees, snow', 6, '1920x1080', 24, 'japanese', 'animatediff', 'completed'],
    ['Time-lapse of a flower blooming, soft natural lighting', 'wilting, dead, dark', 4, '1280x720', 30, 'nature', 'stable-video-diffusion', 'completed'],
    ['A phoenix rising from flames, epic fantasy scene with dramatic fire effects', 'modern, realistic, mundane', 4, '1280x720', 24, 'fantasy', 'animatediff', 'processing'],
    ['Drone shot flying over a tropical island with turquoise water', 'urban, polluted, cloudy', 6, '1920x1080', 24, 'travel', 'stable-video-diffusion', 'pending'],
    ['Ballet dancer performing pirouette in a grand theater, spotlight', 'amateur, casual, outdoor', 4, '1280x720', 30, 'artistic', 'zeroscope-v2', 'completed'],
    ['Racing car drifting through a corner with smoke and sparks', 'parked, stationary, slow', 3, '1280x720', 60, 'sports', 'animatediff', 'failed'],
    ['Northern lights aurora borealis over a snowy mountain landscape', 'daytime, urban, clear sky', 6, '1920x1080', 24, 'nature', 'stable-video-diffusion', 'completed'],
    ['Robot assembling itself piece by piece in a futuristic laboratory', 'organic, natural, primitive', 4, '1280x720', 24, 'sci-fi', 'zeroscope-v2', 'pending'],
    ['Waterfall cascading into a crystal-clear pool in a tropical forest', 'desert, dry, barren', 4, '1280x720', 24, 'nature', 'stable-video-diffusion', 'completed'],
    ['Abstract paint mixing and swirling in water, colorful macro shot', 'solid, static, monochrome', 4, '1280x720', 30, 'abstract', 'animatediff', 'processing'],
  ];
  for (const t of t2v) {
    await pool.query('INSERT INTO text_to_video (prompt,negative_prompt,duration_seconds,resolution,fps,style,model,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', t);
  }

  // Image-to-Video (15)
  await pool.query('DELETE FROM image_to_video');
  const i2v = [
    ['Sunset Beach Animation', 'https://images.unsplash.com/photo-sunset-beach', 'Gentle wave motion, clouds drifting', 4, 0.7, 'stable-video-diffusion', 'completed'],
    ['Portrait Come Alive', 'https://images.unsplash.com/photo-portrait', 'Subtle head movement, blinking, hair flowing', 3, 0.5, 'stable-video-diffusion', 'completed'],
    ['Mountain Landscape Pan', 'https://images.unsplash.com/photo-mountain', 'Slow pan right, clouds moving, birds flying', 6, 0.6, 'stable-video-diffusion', 'processing'],
    ['City Street Timelapse', 'https://images.unsplash.com/photo-city-street', 'People walking, cars moving, lights changing', 4, 0.8, 'animatediff', 'completed'],
    ['Flower Garden Bloom', 'https://images.unsplash.com/photo-flowers', 'Flowers swaying, butterflies, gentle breeze', 4, 0.6, 'stable-video-diffusion', 'pending'],
    ['Space Nebula Motion', 'https://images.unsplash.com/photo-nebula', 'Slowly rotating, stars twinkling, gas flowing', 6, 0.4, 'stable-video-diffusion', 'completed'],
    ['Waterfall Animation', 'https://images.unsplash.com/photo-waterfall', 'Water flowing, mist rising, leaves moving', 4, 0.9, 'stable-video-diffusion', 'completed'],
    ['Cat Portrait Animate', 'https://images.unsplash.com/photo-cat', 'Cat blinking, ears twitching, whiskers moving', 3, 0.5, 'animatediff', 'processing'],
    ['Abstract Art Motion', 'https://images.unsplash.com/photo-abstract', 'Colors flowing and blending, psychedelic motion', 4, 0.7, 'animatediff', 'completed'],
    ['Racing Car Zoom', 'https://images.unsplash.com/photo-racecar', 'Speed blur effect, wheels spinning, motion blur', 3, 0.9, 'stable-video-diffusion', 'failed'],
    ['Ocean Aerial View', 'https://images.unsplash.com/photo-ocean-aerial', 'Waves moving, foam patterns, drone drift', 6, 0.6, 'stable-video-diffusion', 'completed'],
    ['Campfire Flicker', 'https://images.unsplash.com/photo-campfire', 'Flames dancing, sparks rising, smoke drifting', 4, 0.8, 'animatediff', 'completed'],
    ['Architecture Dolly', 'https://images.unsplash.com/photo-building', 'Slow dolly in, perspective shift, clouds moving', 4, 0.5, 'stable-video-diffusion', 'pending'],
    ['Food Plating Spin', 'https://images.unsplash.com/photo-food', 'Slow 360 rotation, steam rising', 4, 0.6, 'stable-video-diffusion', 'completed'],
    ['Snow Scene Winter', 'https://images.unsplash.com/photo-snow', 'Snowflakes falling, gentle wind, frost forming', 6, 0.5, 'animatediff', 'processing'],
  ];
  for (const i of i2v) {
    await pool.query('INSERT INTO image_to_video (name,image_url,motion_prompt,duration_seconds,motion_strength,model,status) VALUES ($1,$2,$3,$4,$5,$6,$7)', i);
  }

  // Video Templates (15)
  await pool.query('DELETE FROM video_templates');
  const templates = [
    ['Product Showcase', 'Clean product reveal with rotating display', 'commercial', '1920x1080', 15, 'commercial', null, '{"bg":"white","rotation":360}'],
    ['Social Story', 'Vertical format for Instagram/TikTok stories', 'social', '1080x1920', 15, 'trendy', null, '{"format":"vertical","overlays":true}'],
    ['Cinematic Intro', 'Dramatic movie-style title sequence', 'film', '2560x1440', 10, 'cinematic', null, '{"letterbox":true,"grain":true}'],
    ['News Lower Third', 'Professional news-style lower third animations', 'broadcast', '1920x1080', 5, 'professional', null, '{"position":"bottom","animate":"slide"}'],
    ['Countdown Timer', 'Animated countdown with particles', 'event', '1920x1080', 10, 'dynamic', null, '{"from":10,"particles":true}'],
    ['Logo Reveal', 'Elegant logo animation with light effects', 'branding', '1920x1080', 5, 'elegant', null, '{"effect":"light_sweep"}'],
    ['Travel Montage', 'Dynamic travel clip compilation template', 'travel', '1920x1080', 30, 'travel', null, '{"clips":6,"transitions":"dynamic"}'],
    ['Tutorial Overlay', 'Screen recording with annotations template', 'education', '1920x1080', 60, 'clean', null, '{"annotations":true,"webcam_pip":true}'],
    ['Music Visualizer', 'Audio-reactive visual effects template', 'music', '1920x1080', 30, 'psychedelic', null, '{"reactive":true,"spectrum":true}'],
    ['Real Estate Tour', 'Property showcase with text overlays', 'real_estate', '3840x2160', 60, 'architectural', null, '{"overlays":["price","sqft","beds"]}'],
    ['Wedding Invitation', 'Elegant animated wedding invite', 'event', '1080x1920', 15, 'romantic', null, '{"flowers":true,"gold_accents":true}'],
    ['Fitness Workout', 'Exercise demonstration with timer', 'fitness', '1080x1920', 30, 'energetic', null, '{"timer":true,"reps_counter":true}'],
    ['Recipe Card', 'Step-by-step cooking recipe animation', 'food', '1080x1080', 60, 'warm', null, '{"steps":true,"ingredients_list":true}'],
    ['Portfolio Reel', 'Creative portfolio showcase template', 'creative', '1920x1080', 45, 'minimal', null, '{"grid":true,"hover_zoom":true}'],
    ['Podcast Audiogram', 'Audio waveform with captions', 'podcast', '1080x1080', 60, 'modern', null, '{"waveform":true,"captions":true}'],
  ];
  for (const t of templates) {
    await pool.query('INSERT INTO video_templates (name,description,category,resolution,duration_seconds,style,thumbnail_url,config) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', t);
  }

  // Storyboards (15)
  await pool.query('DELETE FROM storyboards');
  const storyboards = [
    ['Product Launch Campaign', 'Multi-scene product reveal video', 1, '[{"scene":"Opening","desc":"Dark bg, spotlight appears"},{"scene":"Reveal","desc":"Product rotates into view"},{"scene":"Features","desc":"Feature highlights"},{"scene":"CTA","desc":"Call to action"}]', 'completed'],
    ['Brand Story Video', 'Company origin and mission narrative', 2, '[{"scene":"History","desc":"Vintage footage style"},{"scene":"Growth","desc":"Timeline montage"},{"scene":"Today","desc":"Modern office tour"},{"scene":"Future","desc":"Vision statement"}]', 'in_progress'],
    ['Tutorial Series Ep1', 'Getting started guide for new users', 3, '[{"scene":"Intro","desc":"Animated logo"},{"scene":"Setup","desc":"Screen recording"},{"scene":"Demo","desc":"Feature walkthrough"},{"scene":"Summary","desc":"Key takeaways"}]', 'draft'],
    ['Music Video Concept', 'Neon Dreams music video storyboard', 3, '[{"scene":"Verse 1","desc":"City nightscape"},{"scene":"Chorus","desc":"Dancing in neon rain"},{"scene":"Bridge","desc":"Abstract visuals"},{"scene":"Outro","desc":"Sunrise"}]', 'approved'],
    ['Documentary Opening', 'Nature documentary first 2 minutes', 4, '[{"scene":"Aerial","desc":"Mountain flyover"},{"scene":"Close-up","desc":"Wildlife macro"},{"scene":"Wide","desc":"Landscape panorama"},{"scene":"Title","desc":"Title card"}]', 'completed'],
    ['Social Ad - Summer Sale', 'Quick summer sale promotion', 5, '[{"scene":"Hook","desc":"Eye-catching visual"},{"scene":"Products","desc":"Product grid"},{"scene":"Discount","desc":"Big discount reveal"},{"scene":"CTA","desc":"Shop now button"}]', 'approved'],
    ['Wedding Film Plan', 'Full wedding day video outline', 8, '[{"scene":"Prep","desc":"Getting ready shots"},{"scene":"Ceremony","desc":"Vows and rings"},{"scene":"Reception","desc":"First dance"},{"scene":"Farewell","desc":"Sparkler exit"}]', 'in_progress'],
    ['Fitness Challenge', '30-day challenge promo video', 11, '[{"scene":"Before","desc":"Starting point"},{"scene":"Training","desc":"Workout montage"},{"scene":"Progress","desc":"Results reveal"},{"scene":"CTA","desc":"Join challenge"}]', 'draft'],
    ['Real Estate Showcase', 'Luxury home virtual tour', 7, '[{"scene":"Exterior","desc":"Drone approach"},{"scene":"Living","desc":"Interior sweep"},{"scene":"Kitchen","desc":"Feature highlights"},{"scene":"Pool","desc":"Backyard reveal"}]', 'completed'],
    ['Animated Explainer', 'How our app works in 60 seconds', 13, '[{"scene":"Problem","desc":"User pain point"},{"scene":"Solution","desc":"App introduction"},{"scene":"How","desc":"Step by step"},{"scene":"Result","desc":"Happy outcome"}]', 'in_progress'],
    ['Travel Vlog Plan', 'Tokyo travel adventure outline', 10, '[{"scene":"Airport","desc":"Journey begins"},{"scene":"Streets","desc":"Shibuya crossing"},{"scene":"Food","desc":"Ramen close-up"},{"scene":"Temple","desc":"Sensoji temple"}]', 'approved'],
    ['Horror Short Script', 'The Mirror - horror short film', 14, '[{"scene":"Setup","desc":"Normal bathroom"},{"scene":"Tension","desc":"Mirror flickers"},{"scene":"Climax","desc":"Reflection moves"},{"scene":"Twist","desc":"Final scare"}]', 'draft'],
    ['Cooking Show Pilot', 'Gourmet cooking show first episode', 9, '[{"scene":"Ingredients","desc":"Fresh ingredients display"},{"scene":"Prep","desc":"Cutting and mixing"},{"scene":"Cook","desc":"Sizzling action"},{"scene":"Plate","desc":"Final presentation"}]', 'approved'],
    ['Corporate Year Review', 'Annual company highlights video', 13, '[{"scene":"Highlights","desc":"Key achievements"},{"scene":"Team","desc":"Team photos montage"},{"scene":"Numbers","desc":"Stats animation"},{"scene":"Future","desc":"Next year goals"}]', 'in_progress'],
    ['Game Trailer Concept', 'Indie game announcement trailer', 6, '[{"scene":"World","desc":"Game world reveal"},{"scene":"Character","desc":"Hero introduction"},{"scene":"Action","desc":"Gameplay montage"},{"scene":"Logo","desc":"Title and date"}]', 'draft'],
  ];
  for (const s of storyboards) {
    await pool.query('INSERT INTO storyboards (title,description,project_id,scenes,status) VALUES ($1,$2,$3,$4,$5)', s);
  }

  // Scenes (15)
  await pool.query('DELETE FROM scenes');
  const scenes = [
    ['Opening Shot', 'Dramatic wide establishing shot', 1, 1, 5, 'Sweeping aerial view of golden sunset over ocean, warm orange and purple tones, lens flare', 'none', 'crossfade', 'drone_forward'],
    ['Product Reveal', 'Product appears from darkness', 2, 2, 4, 'Sleek tech product emerging from shadows, spotlight illumination, reflective surface', 'fade', 'slide', 'orbit_360'],
    ['Hero Close-up', 'Detailed product macro shot', 2, 3, 3, 'Ultra close-up of product details, shallow depth of field, studio lighting', 'slide', 'fade', 'slow_zoom_in'],
    ['City Night Flyover', 'Aerial city at night', 3, 1, 6, 'Cyberpunk cityscape from above, neon lights, rain-slicked streets, flying vehicles', 'none', 'glitch', 'drone_forward'],
    ['Neon Rain Dance', 'Character dancing in neon rain', 3, 2, 8, 'Silhouette dancing in colorful rain, neon reflections on wet ground, dramatic backlight', 'glitch', 'wipe', 'tracking_shot'],
    ['Mountain Panorama', 'Epic mountain landscape reveal', 4, 1, 7, 'Massive mountain range with snow peaks, golden hour light, clouds below', 'none', 'crossfade', 'slow_pan_right'],
    ['Wildlife Close-up', 'Animal in natural habitat', 4, 2, 5, 'Majestic eagle soaring above misty valley, feather details, wind motion', 'crossfade', 'fade', 'tracking_shot'],
    ['Beach Paradise', 'Tropical beach establishing shot', 1, 2, 5, 'Crystal clear turquoise water, white sand beach, palm trees swaying', 'crossfade', 'dissolve', 'slow_pan_left'],
    ['Cocktail Pour', 'Dramatic drink preparation', 9, 1, 4, 'Amber liquid pouring into crystal glass, ice cubes, slow motion splash', 'fade', 'wipe', 'slow_zoom_in'],
    ['Sushi Assembly', 'Chef preparing sushi roll', 9, 2, 6, 'Expert hands rolling sushi, rice and fish details, bamboo mat, steam', 'wipe', 'crossfade', 'top_down'],
    ['Yoga Sunrise', 'Meditation pose at dawn', 11, 1, 5, 'Person in warrior pose on cliff edge, sunrise behind, peaceful atmosphere', 'fade', 'dissolve', 'orbit_slow'],
    ['Running Sequence', 'Athletic sprint in slow motion', 11, 2, 4, 'Runner in motion, muscles in detail, sweat droplets, stadium background', 'dissolve', 'fade', 'tracking_shot'],
    ['Mirror Scene', 'Horror mirror reflection', 14, 1, 6, 'Person looking in bathroom mirror, dim lighting, mirror shows different expression', 'none', 'smash_cut', 'slow_zoom_in'],
    ['Abstract Flow', 'Flowing colors and shapes', 12, 1, 8, 'Liquid paint colors merging and flowing, iridescent surfaces, macro detail', 'dissolve', 'morph', 'static'],
    ['Logo Animation', 'Company logo reveal', 2, 4, 3, 'Particles assembling into company logo, light burst, clean white background', 'crossfade', 'none', 'zoom_out'],
  ];
  for (const s of scenes) {
    await pool.query('INSERT INTO scenes (name,description,project_id,scene_order,duration_seconds,prompt,transition_in,transition_out,camera_motion) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', s);
  }

  // Media Library (15)
  await pool.query('DELETE FROM media_library');
  const media = [
    ['Sunset_Beach_4K.mp4', 'video', '/media/sunset_beach_4k.mp4', '2.3GB', 60, '3840x2160', 'mp4', '["nature","sunset","beach","4k"]'],
    ['City_Drone_Night.mp4', 'video', '/media/city_drone_night.mp4', '1.8GB', 45, '3840x2160', 'mp4', '["city","night","drone","aerial"]'],
    ['Product_Rotate.mp4', 'video', '/media/product_rotate.mp4', '450MB', 15, '1920x1080', 'mp4', '["product","commercial","studio"]'],
    ['Ocean_Waves.wav', 'audio', '/media/ocean_waves.wav', '85MB', 120, null, 'wav', '["nature","ocean","ambient"]'],
    ['Hero_Image_Main.png', 'image', '/media/hero_image_main.png', '12MB', null, '4000x2667', 'png', '["hero","landscape","photography"]'],
    ['Logo_Animation.gif', 'image', '/media/logo_animation.gif', '2.5MB', null, '500x500', 'gif', '["logo","animation","branding"]'],
    ['Mountain_Timelapse.mp4', 'video', '/media/mountain_timelapse.mp4', '3.1GB', 90, '3840x2160', 'mp4', '["mountain","timelapse","nature"]'],
    ['Rain_Ambience.mp3', 'audio', '/media/rain_ambience.mp3', '45MB', 300, null, 'mp3', '["rain","ambient","atmosphere"]'],
    ['Fashion_Model.mp4', 'video', '/media/fashion_model.mp4', '800MB', 30, '1920x1080', 'mp4', '["fashion","model","editorial"]'],
    ['Fireworks_4K.mp4', 'video', '/media/fireworks_4k.mp4', '1.2GB', 20, '3840x2160', 'mp4', '["fireworks","celebration","night"]'],
    ['Abstract_BG.mp4', 'video', '/media/abstract_bg.mp4', '350MB', 30, '1920x1080', 'mp4', '["abstract","background","loop"]'],
    ['Cooking_CloseUp.mp4', 'video', '/media/cooking_closeup.mp4', '650MB', 45, '1920x1080', 'mp4', '["food","cooking","macro"]'],
    ['Texture_Pack.zip', 'other', '/media/texture_pack.zip', '500MB', null, null, 'zip', '["textures","overlay","effects"]'],
    ['Voice_Over_Draft.mp3', 'audio', '/media/voice_over_draft.mp3', '15MB', 60, null, 'mp3', '["voiceover","narration","draft"]'],
    ['Snow_Particles.mov', 'video', '/media/snow_particles.mov', '200MB', 10, '1920x1080', 'mov', '["snow","particles","overlay","alpha"]'],
  ];
  for (const m of media) {
    await pool.query('INSERT INTO media_library (name,type,url,file_size,duration_seconds,resolution,format,tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', m);
  }

  // Transitions (15)
  await pool.query('DELETE FROM transitions');
  const transitions = [
    ['Smooth Fade', 'fade', 500, 'ease-in-out', 'Classic smooth fade between scenes', null, '{"opacity_curve":"linear"}'],
    ['Cross Dissolve', 'dissolve', 750, 'ease-in-out', 'Gradual dissolve blending two scenes', null, '{"blend_mode":"normal"}'],
    ['Slide Left', 'slide', 400, 'ease-out', 'Scene slides in from the right', null, '{"direction":"left"}'],
    ['Slide Up', 'slide', 400, 'ease-out', 'Scene slides up from bottom', null, '{"direction":"up"}'],
    ['Zoom Through', 'zoom', 600, 'ease-in', 'Zoom into scene center transition', null, '{"scale":3,"focal":"center"}'],
    ['Wipe Right', 'wipe', 500, 'linear', 'Horizontal wipe from left to right', null, '{"direction":"right","softness":0.1}'],
    ['Circle Reveal', 'shape', 700, 'ease-out', 'Circle expanding from center', null, '{"shape":"circle","from":"center"}'],
    ['Glitch Cut', 'glitch', 300, 'linear', 'Digital glitch effect transition', null, '{"intensity":0.8,"rgb_shift":true}'],
    ['Film Burn', 'overlay', 800, 'ease-in-out', 'Vintage film burn transition effect', null, '{"color":"orange","flicker":true}'],
    ['Smash Cut', 'cut', 0, 'linear', 'Instant hard cut for dramatic effect', null, '{"flash":false}'],
    ['Spin Blur', 'blur', 600, 'ease-in-out', 'Spinning blur transition between scenes', null, '{"rotations":1,"blur_amount":20}'],
    ['Pixelate', 'digital', 500, 'ease-in', 'Pixelation transition effect', null, '{"pixel_size":32,"direction":"in"}'],
    ['Morph', 'morph', 1000, 'ease-in-out', 'Smooth morph between two scenes', null, '{"smoothness":0.8}'],
    ['Light Leak', 'overlay', 600, 'ease-out', 'Colorful light leak overlay transition', null, '{"colors":["orange","pink","blue"]}'],
    ['Page Curl', 'shape', 800, 'ease-in-out', 'Page turning curl effect', null, '{"direction":"top-right","shadow":true}'],
  ];
  for (const t of transitions) {
    await pool.query('INSERT INTO transitions (name,type,duration_ms,easing,description,preview_url,config) VALUES ($1,$2,$3,$4,$5,$6,$7)', t);
  }

  // Audio Tracks (15)
  await pool.query('DELETE FROM audio_tracks');
  const audio = [
    ['Epic Cinematic Rise', 'music', '/audio/epic_cinematic.mp3', 180, 120, 'orchestral', 'epic', 'royalty-free'],
    ['Lo-Fi Chill Beats', 'music', '/audio/lofi_chill.mp3', 240, 85, 'lo-fi', 'relaxed', 'royalty-free'],
    ['Corporate Upbeat', 'music', '/audio/corporate_upbeat.mp3', 120, 128, 'corporate', 'positive', 'royalty-free'],
    ['Dark Ambient Drone', 'music', '/audio/dark_ambient.mp3', 300, 60, 'ambient', 'dark', 'royalty-free'],
    ['Tropical Summer Vibes', 'music', '/audio/tropical_summer.mp3', 180, 110, 'tropical', 'happy', 'royalty-free'],
    ['Piano Emotional', 'music', '/audio/piano_emotional.mp3', 200, 72, 'classical', 'emotional', 'royalty-free'],
    ['EDM Drop Energy', 'music', '/audio/edm_drop.mp3', 150, 150, 'electronic', 'energetic', 'royalty-free'],
    ['Acoustic Folk Guitar', 'music', '/audio/acoustic_folk.mp3', 180, 100, 'folk', 'warm', 'royalty-free'],
    ['Horror Tension Build', 'music', '/audio/horror_tension.mp3', 120, 80, 'horror', 'tense', 'royalty-free'],
    ['Jazz Smooth Night', 'music', '/audio/jazz_smooth.mp3', 240, 95, 'jazz', 'smooth', 'royalty-free'],
    ['Whoosh Transition SFX', 'sfx', '/audio/whoosh.mp3', 2, null, 'sfx', 'transition', 'royalty-free'],
    ['Camera Shutter Click', 'sfx', '/audio/shutter.mp3', 1, null, 'sfx', 'click', 'royalty-free'],
    ['Explosion Impact', 'sfx', '/audio/explosion.mp3', 3, null, 'sfx', 'dramatic', 'royalty-free'],
    ['Ocean Waves Ambient', 'ambience', '/audio/ocean_ambient.mp3', 600, null, 'nature', 'peaceful', 'royalty-free'],
    ['City Traffic Background', 'ambience', '/audio/city_traffic.mp3', 300, null, 'urban', 'busy', 'royalty-free'],
  ];
  for (const a of audio) {
    await pool.query('INSERT INTO audio_tracks (name,type,url,duration_seconds,bpm,genre,mood,license) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', a);
  }

  // Video Styles (15)
  await pool.query('DELETE FROM video_styles');
  const styles = [
    ['Cinematic Film', 'Hollywood blockbuster look with dramatic lighting', 'cinematic, dramatic lighting, film grain, anamorphic lens flare, color graded', 'amateur, home video, low quality, shaky', null, 'cinematic', '{"grain":0.3,"contrast":1.2}'],
    ['Anime Style', 'Japanese animation aesthetic', 'anime style, cel shading, vibrant colors, dynamic angles, manga inspired', 'photorealistic, 3d render, live action', null, 'anime', '{"cel_shade":true,"outline":true}'],
    ['Cyberpunk Neon', 'Futuristic neon-lit urban aesthetic', 'cyberpunk, neon lights, rain, holographic, futuristic city, purple and cyan', 'natural, daylight, rural, vintage', null, 'sci-fi', '{"neon_glow":true,"rain":true}'],
    ['Watercolor Paint', 'Hand-painted watercolor animation', 'watercolor painting, soft brush strokes, paper texture, pastel colors, artistic', 'photorealistic, sharp, digital, hard edges', null, 'artistic', '{"brush_texture":true}'],
    ['Vintage Film', '1970s retro film aesthetic', 'vintage film, 70s aesthetic, warm tones, film grain, light leaks, vignette', 'modern, clean, digital, sharp', null, 'vintage', '{"grain":0.6,"vignette":0.4}'],
    ['3D Render Clean', 'Modern 3D rendered look', '3d render, octane render, clean, studio lighting, subsurface scattering', 'flat, 2d, sketch, hand drawn', null, 'modern', '{"render":"octane","quality":"high"}'],
    ['Oil Painting', 'Classical oil painting style', 'oil painting, canvas texture, thick brush strokes, classical art, renaissance', 'photo, digital, modern, clean', null, 'artistic', '{"brush_size":"thick","texture":"canvas"}'],
    ['Noir Black & White', 'Film noir detective aesthetic', 'film noir, black and white, high contrast, dramatic shadows, 1940s', 'colorful, bright, cheerful, modern', null, 'noir', '{"bw":true,"contrast":1.5}'],
    ['Dreamy Soft Focus', 'Ethereal dream-like quality', 'soft focus, dreamy, ethereal, bloom, pastel, gentle light, haze', 'sharp, harsh, high contrast, dark', null, 'ethereal', '{"bloom":0.6,"softness":0.4}'],
    ['Documentary Raw', 'Raw documentary footage style', 'documentary style, natural lighting, handheld camera, authentic, raw', 'staged, artificial, studio, polished', null, 'documentary', '{"stabilization":false}'],
    ['Pixel Art', 'Retro pixel art game style', 'pixel art, 8-bit, retro gaming, limited color palette, pixelated', 'smooth, high resolution, photorealistic', null, 'retro', '{"pixel_size":4,"palette":"limited"}'],
    ['Minimalist Modern', 'Clean minimal design aesthetic', 'minimalist, clean lines, white space, modern design, simple geometry', 'cluttered, complex, ornate, busy', null, 'modern', '{"whitespace":true}'],
    ['Surrealist Dream', 'Salvador Dali inspired surrealism', 'surrealist, dreamlike, melting objects, impossible geometry, Dali inspired', 'realistic, normal, ordinary, mundane', null, 'artistic', '{"distortion":true}'],
    ['Nature Photography', 'National Geographic quality nature', 'nature photography, sharp detail, vibrant colors, golden hour, professional', 'artificial, studio, urban, indoor', null, 'nature', '{"clarity":"high","vibrance":1.3}'],
    ['Comic Book Pop', 'Bold comic book illustration style', 'comic book style, bold outlines, halftone dots, speech bubbles, pop art', 'photorealistic, subtle, muted colors', null, 'illustration', '{"outline":"bold","halftone":true}'],
  ];
  for (const s of styles) {
    await pool.query('INSERT INTO video_styles (name,description,prompt_modifier,negative_prompt,preview_url,category,config) VALUES ($1,$2,$3,$4,$5,$6,$7)', s);
  }

  // Render Queue (15)
  await pool.query('DELETE FROM render_queue');
  const renders = [
    ['Sunset Timelapse Final', '3840x2160', 'mp4', 'ultra', 'completed', 100, '00:00', '/output/sunset_final.mp4'],
    ['Product Launch v3', '1920x1080', 'mp4', 'high', 'completed', 100, '00:00', '/output/product_v3.mp4'],
    ['Neon Dreams MV', '1920x1080', 'mp4', 'high', 'rendering', 67, '02:15', null],
    ['Nature Doc Intro', '3840x2160', 'mov', 'ultra', 'rendering', 45, '05:30', null],
    ['Fashion Lookbook IG', '1080x1920', 'mp4', 'high', 'queued', 0, '08:00', null],
    ['Sci-Fi Scene 1', '2560x1440', 'mp4', 'ultra', 'queued', 0, '12:00', null],
    ['Real Estate Tour HD', '3840x2160', 'mp4', 'high', 'completed', 100, '00:00', '/output/realestate_hd.mp4'],
    ['Wedding Highlight Reel', '1920x1080', 'mp4', 'high', 'rendering', 82, '01:00', null],
    ['Food Ad 15sec', '1920x1080', 'mp4', 'high', 'completed', 100, '00:00', '/output/food_ad_15.mp4'],
    ['Travel Intro Bumper', '1920x1080', 'mp4', 'medium', 'completed', 100, '00:00', '/output/travel_intro.mp4'],
    ['Fitness Reel Vertical', '1080x1920', 'mp4', 'high', 'failed', 34, null, null],
    ['Abstract Loop', '1920x1080', 'webm', 'high', 'completed', 100, '00:00', '/output/abstract_loop.webm'],
    ['Corporate Prez', '1920x1080', 'mp4', 'medium', 'queued', 0, '04:00', null],
    ['Horror Teaser', '2560x1440', 'mp4', 'ultra', 'paused', 15, '10:00', null],
    ['Social Ad Pack x3', '1080x1080', 'mp4', 'high', 'rendering', 55, '03:00', null],
  ];
  for (const r of renders) {
    await pool.query('INSERT INTO render_queue (project_name,resolution,format,quality,status,progress,estimated_time,output_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', r);
  }

  // Export Presets (15)
  await pool.query('DELETE FROM export_presets');
  const exports = [
    ['YouTube 4K', 'mp4', 'h264', '3840x2160', '35000k', 30, 'ultra', 'Optimized for YouTube 4K uploads'],
    ['YouTube 1080p', 'mp4', 'h264', '1920x1080', '8000k', 30, 'high', 'Standard YouTube HD quality'],
    ['Instagram Reel', 'mp4', 'h264', '1080x1920', '6000k', 30, 'high', 'Vertical format for IG Reels'],
    ['Instagram Story', 'mp4', 'h264', '1080x1920', '4000k', 30, 'medium', 'Optimized for Stories'],
    ['TikTok Vertical', 'mp4', 'h264', '1080x1920', '5000k', 30, 'high', 'TikTok optimal format'],
    ['Twitter Video', 'mp4', 'h264', '1280x720', '5000k', 30, 'medium', 'Twitter video specifications'],
    ['LinkedIn Professional', 'mp4', 'h264', '1920x1080', '6000k', 30, 'high', 'Professional LinkedIn format'],
    ['ProRes Master', 'mov', 'prores_422', '3840x2160', '220000k', 24, 'lossless', 'ProRes 422 master for editing'],
    ['Web GIF Preview', 'gif', 'gif', '480x270', '0', 15, 'medium', 'Small animated GIF preview'],
    ['Cinema DCP', 'mxf', 'jpeg2000', '4096x2160', '250000k', 24, 'cinema', 'Digital Cinema Package format'],
    ['Mobile Optimized', 'mp4', 'h265', '720x1280', '2000k', 30, 'medium', 'Small file for mobile viewing'],
    ['Facebook Feed', 'mp4', 'h264', '1280x720', '4000k', 30, 'medium', 'Facebook news feed optimal'],
    ['Email Attachment', 'mp4', 'h264', '640x360', '1000k', 24, 'low', 'Ultra compressed for email'],
    ['Vimeo HQ', 'mp4', 'h264', '1920x1080', '12000k', 24, 'high', 'High quality for Vimeo'],
    ['Archive RAW', 'mov', 'dnxhd', '1920x1080', '185000k', 24, 'lossless', 'DNxHD archive master'],
  ];
  for (const e of exports) {
    await pool.query('INSERT INTO export_presets (name,format,codec,resolution,bitrate,fps,quality,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', e);
  }

  // AI Prompts (15)
  await pool.query('DELETE FROM ai_prompts');
  const promptsData = [
    ['Cinematic Sunset', 'Golden sunset over calm ocean, volumetric god rays piercing through dramatic cumulus clouds, 8K cinematic quality, anamorphic lens, warm color palette', 'night, dark, indoor, ugly, distorted', 'nature', 'cinematic', '["sunset","ocean","golden hour"]'],
    ['Cyberpunk Street', 'Rainy cyberpunk city street at night, neon signs in Japanese, holographic advertisements, puddle reflections, dense fog, Blade Runner aesthetic', 'daylight, sunny, rural, empty, clean', 'urban', 'cyberpunk', '["city","neon","rain","night"]'],
    ['Space Nebula Flight', 'Flying through colorful space nebula, stars and cosmic dust, iridescent gas clouds, deep space, Hubble telescope quality', 'earth, ground, indoor, terrestrial', 'space', 'sci-fi', '["space","nebula","cosmic"]'],
    ['Forest Fairy Tale', 'Enchanted forest with bioluminescent mushrooms, fairy lights, misty atmosphere, magical particles, ancient trees', 'urban, modern, industrial, desert', 'fantasy', 'fantasy', '["forest","magic","enchanted"]'],
    ['Underwater Coral', 'Underwater coral reef with tropical fish, sunlight rays through water, vibrant marine life, crystal clear ocean', 'above water, land, dirty water', 'nature', 'nature', '["underwater","coral","ocean"]'],
    ['Aerial Mountain Dawn', 'Drone shot over snow-capped mountains at dawn, first light painting peaks gold, sea of clouds below, epic scale', 'flat, urban, night, underground', 'nature', 'cinematic', '["mountains","aerial","dawn"]'],
    ['Abstract Liquid', 'Macro shot of metallic liquid mercury flowing and forming abstract shapes, iridescent reflections, slow motion', 'solid, static, rough, matte', 'abstract', 'abstract', '["abstract","liquid","macro"]'],
    ['Vintage Cafe Paris', 'Charming Parisian cafe on a rainy evening, warm interior glow, cobblestone street, vintage aesthetic, 1960s France', 'modern, bright, suburban, American', 'lifestyle', 'vintage', '["paris","cafe","rain","vintage"]'],
    ['Robot Assembly', 'Advanced humanoid robot being assembled in futuristic factory, sparks, precise machinery, blue LED lighting', 'primitive, manual, organic, natural', 'tech', 'sci-fi', '["robot","factory","tech"]'],
    ['Autumn Forest Path', 'Walking path through autumn forest, red and gold leaves falling, soft sunlight filtering through canopy, peaceful', 'winter, barren, dark, dead trees', 'nature', 'nature', '["autumn","forest","leaves"]'],
    ['Food Close-up Sushi', 'Extreme close-up of fresh sushi being assembled, rice grains visible, fish glistening, chef hands, wasabi detail', 'blurry, distant, unappetizing', 'food', 'commercial', '["sushi","food","closeup"]'],
    ['Lightning Storm', 'Dramatic lightning storm over open prairie, multiple bolt strikes, dark purple clouds, supercell storm structure', 'calm, clear sky, sunny, peaceful', 'nature', 'dramatic', '["storm","lightning","dramatic"]'],
    ['Ballroom Dance', 'Elegant couple waltzing in grand ballroom, crystal chandelier, flowing dress, golden light, romantic atmosphere', 'casual, outdoor, modern, rough', 'lifestyle', 'romantic', '["dance","ballroom","elegant"]'],
    ['Volcanic Eruption', 'Active volcano erupting with flowing lava, explosive ash cloud, fire and magma, dramatic power of nature', 'calm, peaceful, frozen, cold', 'nature', 'dramatic', '["volcano","lava","eruption"]'],
    ['Steampunk Clockwork', 'Intricate steampunk clockwork mechanism, brass gears turning, steam pipes, Victorian engineering aesthetic', 'digital, modern, minimalist, electronic', 'fantasy', 'steampunk', '["steampunk","clockwork","brass"]'],
  ];
  for (const p of promptsData) {
    await pool.query('INSERT INTO ai_prompts (name,prompt,negative_prompt,category,style,tags) VALUES ($1,$2,$3,$4,$5,$6)', p);
  }

  // Settings (15)
  await pool.query('DELETE FROM settings');
  const settings = [
    ['default_resolution', '1920x1080', 'video', 'Default video resolution for new projects'],
    ['default_fps', '24', 'video', 'Default frames per second'],
    ['default_duration', '10', 'video', 'Default video duration in seconds'],
    ['default_style', 'cinematic', 'video', 'Default visual style for generation'],
    ['max_render_jobs', '3', 'rendering', 'Maximum concurrent render jobs'],
    ['render_quality', 'high', 'rendering', 'Default render quality setting'],
    ['ai_model', 'anthropic/claude-haiku-4.5', 'ai', 'Default AI model for prompts'],
    ['ai_temperature', '0.7', 'ai', 'Default AI temperature setting'],
    ['video_model', 'stable-video-diffusion', 'ai', 'Default video generation model'],
    ['auto_save_interval', '30', 'general', 'Auto-save interval in seconds'],
    ['max_file_size', '5120', 'uploads', 'Maximum upload file size in MB'],
    ['thumbnail_quality', '85', 'media', 'JPEG quality for thumbnails'],
    ['enable_gpu_rendering', 'true', 'rendering', 'Use GPU acceleration for rendering'],
    ['watermark_enabled', 'false', 'export', 'Add watermark to exported videos'],
    ['theme', 'dark', 'ui', 'Application UI theme'],
  ];
  for (const s of settings) {
    await pool.query('INSERT INTO settings (key,value,category,description) VALUES ($1,$2,$3,$4)', s);
  }

  console.log('Database seeded successfully!');
  await pool.end();
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
