// lib/mock.ts
// Aikya — starter content (local-first + national + global + wisdom)
// You can safely publish this as placeholder. Replace with real curated items.

// Types
export type Story = {
  id: string;
  slug: string;                 // lowercase-with-dashes, unique
  title: string;                // 60–70 chars
  dek: string;                  // 20–30 words (one sentence)
  lifeLesson: string;           // <= 16 words
  category: "ActsOfKindness" | "BraveryRescue" | "Innovation" | "Environment" | "GlobalHope" | "Wisdom";
  city?: string;
  state?: string;
  country: string;              // ISO-2 (e.g., "IN")
  readMinutes: number;          // 2–4
  publishedAt: string;          // ISO string
  heroImage?: string;           // remote https:// image
  videoUrl?: string;            // optional YouTube nocookie embed URL
};

// Stories (8 examples)
// Tip: For any with a video, use: https://www.youtube-nocookie.com/embed/VIDEO_ID?rel=0
export const stories: Story[] = [
  {
    id: "s1",
    slug: "delhi-schoolgirl-saves-stray-pups",
    title: "Delhi schoolgirl braves monsoon rain to save two stray pups",
    dek: "A seventh-grader waded through waterlogged lanes to lift two shivering puppies to a dry verandah, turning a stormy afternoon into a lesson in courage.",
    lifeLesson: "Presence of mind can save lives.",
    category: "ActsOfKindness",
    city: "Delhi",
    state: "Delhi",
    country: "IN",
    readMinutes: 3,
    publishedAt: new Date().toISOString(),
    heroImage: "https://images.pexels.com/photos/573241/pexels-photo-573241.jpeg",
    videoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"
  },
  {
    id: "s2",
    slug: "gurugram-startup-builds-solar-lamps",
    title: "Gurugram startup builds affordable solar lamps to help rural night study",
    dek: "A small team assembled low-cost lamps from recycled panels, letting students in two Haryana villages study after sunset without kerosene fumes.",
    lifeLesson: "Small innovations unlock big confidence.",
    category: "Innovation",
    city: "Gurugram",
    state: "Haryana",
    country: "IN",
    readMinutes: 3,
    publishedAt: new Date().toISOString(),
    heroImage: "https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg"
  },
  {
    id: "s3",
    slug: "mumbai-volunteers-repaint-school",
    title: "Mumbai volunteers repaint a municipal school over one weekend",
    dek: "Residents from five buildings teamed up with teachers to refresh classrooms and corridors, turning dull walls into bright alphabet and number murals.",
    lifeLesson: "Community effort multiplies joy.",
    category: "ActsOfKindness",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    readMinutes: 3,
    publishedAt: new Date().toISOString(),
    heroImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7"
  },
  {
    id: "s4",
    slug: "bengaluru-metro-staff-returns-lost-wallet",
    title: "Bengaluru metro staff traces commuter to return a wallet with documents",
    dek: "A station guard reviewed footage and used a business card inside the wallet to call the owner, reuniting them within two hours of the loss.",
    lifeLesson: "Integrity is the easiest way to help.",
    category: "ActsOfKindness",
    city: "Bengaluru",
    state: "Karnataka",
    country: "IN",
    readMinutes: 2,
    publishedAt: new Date().toISOString(),
    heroImage: "https://images.unsplash.com/photo-1520975922284-6c0a5f61b6f5"
  },
  {
    id: "s5",
    slug: "jaipur-donors-network-saves-patient",
    title: "Jaipur blood donors’ network responds at midnight to save a patient",
    dek: "A volunteer dispatcher alerted O-negative donors through a group, and three people reached the hospital within 30 minutes, stabilizing a critical case.",
    lifeLesson: "Preparedness turns empathy into action.",
    category: "BraveryRescue",
    city: "Jaipur",
    state: "Rajasthan",
    country: "IN",
    readMinutes: 3,
    publishedAt: new Date().toISOString(),
    heroImage: "https://images.unsplash.com/photo-1504439904031-93ded9f93a0f"
  },
  {
    id: "s6",
    slug: "pune-students-build-water-filters",
    title: "Pune students assemble low-cost water filters for roadside vendors",
    dek: "An engineering club 3D-printed housings and used activated carbon to cut odors and improve taste for pushcart tea stalls in two neighborhoods.",
    lifeLesson: "Design for dignity.",
    category: "Innovation",
    city: "Pune",
    state: "Maharashtra",
    country: "IN",
    readMinutes: 3,
    publishedAt: new Date().toISOString(),
    heroImage: "https://images.unsplash.com/photo-1532635223-9f3bca6f1a0a"
  },
  {
    id: "s7",
    slug: "chennai-fishermen-rescue-cyclone-day",
    title: "Chennai fishermen rescue three workers stranded during sudden squall",
    dek: "Spotting distress signals near the groynes, a crew steered through choppy water and hauled the workers aboard, earning applause from the shoreline.",
    lifeLesson: "Skill and courage save the day.",
    category: "BraveryRescue",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "IN",
    readMinutes: 3,
    publishedAt: new Date().toISOString(),
    heroImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
  },
  {
    id: "s8",
    slug: "ocean-cleanup-milestone-japan",
    title: "Ocean cleanup volunteers hit a plastic-removal milestone off Japan",
    dek: "Divers and shoreline teams coordinated to clear nets and bottles from a cove, logging weights and mapping hotspots to guide future cleanups.",
    lifeLesson: "Progress grows when we persist together.",
    category: "GlobalHope",
    country: "JP",
    readMinutes: 3,
    publishedAt: new Date().toISOString(),
    heroImage: "https://images.pexels.com/photos/989959/pexels-photo-989959.jpeg"
  }
];
