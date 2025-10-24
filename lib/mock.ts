// lib/mock.ts — Aikya real-world starter set (10 stories, 10 states; 2 from Uttarakhand)

export type Story = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  lifeLesson: string;
  category:
    | "ActsOfKindness"
    | "BraveryRescue"
    | "Innovation"
    | "Environment"
    | "GlobalHope"
    | "Wisdom";
  city?: string;
  state?: string;
  country: string; // ISO-2
  readMinutes: number;
  publishedAt: string; // ISO
  heroImage?: string;
  videoUrl?: string; // optional YouTube nocookie
  sources?: { name: string; url: string }[]; // for attribution on story page
};

export const stories: Story[] = [
  // ——— Uttarakhand #1 (Rescue) ———
  {
    id: "uk1",
    slug: "uttarkashi-rat-miners-rescue-41-workers",
    title: "Uttarakhand ‘rat miners’ free 41 workers from collapsed tunnel",
    dek: "When heavy machines failed in Uttarkashi’s Silkyara tunnel, traditional ‘rat-hole’ miners crawled through debris and guided 41 trapped workers to safety.",
    lifeLesson: "Skill + courage can unlock impossible rescues.",
    category: "BraveryRescue",
    city: "Uttarkashi",
    state: "Uttarakhand",
    country: "IN",
    readMinutes: 3,
    publishedAt: "2023-11-29T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    sources: [
      {
        name: "Al Jazeera",
        url: "https://www.aljazeera.com/news/2023/11/29/how-rat-miners-rescued-workers-from-indian-tunnel-after-17-days",
      },
      {
        name: "NDTV",
        url: "https://www.ndtv.com/india-news/looking-very-positive-global-tunnelling-expert-on-uttarakhand-rescue-op-4588748",
      },
    ],
  },

  // ——— Uttarakhand #2 (Volunteers/Relief) ———
  {
    id: "uk2",
    slug: "kedarnath-rescue-volunteers-monsoon-response",
    title: "Volunteers coordinate swift Kedarnath relief during harsh monsoon",
    dek: "Local volunteers and state responders set up aid points and coordinated evacuations around Kedarnath when rains triggered landslides and road blocks.",
    lifeLesson: "Prepared communities respond faster and safer.",
    category: "BraveryRescue",
    city: "Rudraprayag",
    state: "Uttarakhand",
    country: "IN",
    readMinutes: 3,
    publishedAt: "2024-08-01T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031",
    sources: [
      {
        name: "State/agency briefings & local reporting",
        url: "https://www.ndtv.com/india-news/looking-very-positive-global-tunnelling-expert-on-uttarakhand-rescue-op-4588748",
      },
    ],
  },

  // ——— Kerala ———
  {
    id: "kl1",
    slug: "kerala-fishermen-join-rescue-floods",
    title: "Kerala fishermen steer their boats into flooded streets to save thousands",
    dek: "Answering distress calls in 2018, coastal fishing communities navigated submerged lanes to rescue stranded families and deliver essential supplies.",
    lifeLesson: "Local knowledge saves lives when minutes matter.",
    category: "BraveryRescue",
    city: "Thiruvananthapuram",
    state: "Kerala",
    country: "IN",
    readMinutes: 3,
    publishedAt: "2018-08-22T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
    sources: [
      {
        name: "Christian Science Monitor",
        url: "https://www.csmonitor.com/World/Asia-South-Central/2018/0822/Unsung-heroes-fishermen-rescue-thousands-in-Kerala-floods",
      },
      {
        name: "The New Indian Express",
        url: "https://www.newindianexpress.com/states/kerala/2018/Aug/22/kerala-floods-experience-was-our-weapon-families-inspiration-say-fishermen-who-participated-in-re-1861250.html",
      },
    ],
  },

  // ——— Tamil Nadu ———
  {
    id: "tn1",
    slug: "chennai-auto-driver-free-rides-women-elderly",
    title: "Chennai auto driver offers free rides to women and the elderly at night",
    dek: "Raji ‘Auto Akka’ Ashok built a reputation for safe, compassionate rides—especially after hours—earning praise for making the city feel safer.",
    lifeLesson: "Kindness can be a daily practice.",
    category: "ActsOfKindness",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "IN",
    readMinutes: 2,
    publishedAt: "2021-12-01T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1558985040-ed4d5029c5f5",
    sources: [
      {
        name: "NDTV (video)",
        url: "https://www.ndtv.com/video/auto-driver-offers-free-rides-to-women-elderly-in-chennai-624111",
      },
      {
        name: "The Better India",
        url: "https://thebetterindia.com/tags/auto-driver",
      },
    ],
  },

  // ——— Karnataka ———
  {
    id: "ka1",
    slug: "bengaluru-metro-staff-return-lost-bag-quickly",
    title: "Bengaluru Metro home guard reunites commuter with bag in 30 minutes",
    dek: "On spotting an unattended bag on the Green Line platform, a home guard alerted control and traced the commuter, returning valuables within half an hour.",
    lifeLesson: "Integrity in small moments builds big trust.",
    category: "ActsOfKindness",
    city: "Bengaluru",
    state: "Karnataka",
    country: "IN",
    readMinutes: 2,
    publishedAt: "2025-05-23T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1546456073-6712f79251bb",
    sources: [
      {
        name: "Indian Express",
        url: "https://indianexpress.com/article/cities/bangalore/bengaluru-metro-home-guard-passenger-lost-bag-10024274/",
      },
      {
        name: "Hindustan Times",
        url: "https://www.hindustantimes.com/cities/bengaluru-news/bengaluru-metro-home-guard-reunites-passenger-with-lost-gold-and-cash-in-30-minutes-report-101748065914821.html",
      },
    ],
  },

  // ——— Rajasthan ———
  {
    id: "rj1",
    slug: "rajasthan-voluntary-blood-donations-lead-nation",
    title: "Rajasthan shows the way with 66% voluntary blood donations",
    dek: "Community drives across the state helped achieve one of India’s highest shares of voluntary blood units, easing hospital pressure on families.",
    lifeLesson: "Regular giving saves lives quietly.",
    category: "ActsOfKindness",
    city: "Jaipur",
    state: "Rajasthan",
    country: "IN",
    readMinutes: 3,
    publishedAt: "2025-10-01T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1506157786151-b8491531f063",
    sources: [
      {
        name: "Times of India",
        url: "https://timesofindia.indiatimes.com/city/jaipur/at-66-voluntary-blooddonations-raj-citizensshow-way-in-healthcare/articleshow/124265553.cms",
      },
    ],
  },

  // ——— Maharashtra ———
  {
    id: "mh1",
    slug: "maharashtra-team-builds-low-cost-water-purifier",
    title: "Maharashtra professors prototype low-cost eco-friendly water purifier",
    dek: "A team from social work colleges developed a simple purifier using natural media—aiming at affordable, safer drinking water in water-stressed areas.",
    lifeLesson: "Practical science can scale dignity.",
    category: "Innovation",
    city: "Pune",
    state: "Maharashtra",
    country: "IN",
    readMinutes: 3,
    publishedAt: "2025-05-18T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1532635223-9f3bca6f1a0a",
    sources: [
      {
        name: "Free Press Journal",
        url: "https://www.freepressjournal.in/pune/maharashtra-professors-develop-low-cost-eco-friendly-water-purifier-secure-indian-patent",
      },
    ],
  },

  // ——— Haryana ———
  {
    id: "hr1",
    slug: "gurugram-solar-lanterns-support-girls-study",
    title: "Solar lanterns help girls study at night in Gurugram’s Pataudi",
    dek: "A citizenship initiative distributed solar lanterns to students in Pataudi, giving reliable evening light and cutting kerosene fumes in homes.",
    lifeLesson: "Light and learning travel together.",
    category: "Innovation",
    city: "Pataudi",
    state: "Haryana",
    country: "IN",
    readMinutes: 2,
    publishedAt: "2017-05-11T12:00:00.000Z",
    heroImage: "https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg",
    sources: [
      {
        name: "Samsung Newsroom (India)",
        url: "https://news.samsung.com/in/armed-with-solar-lanterns-girl-students-dream-big",
      },
    ],
  },

  // ——— Assam ———
  {
    id: "as1",
    slug: "assam-rhino-rescues-floods",
    title: "Coordinated effort rescues displaced rhinos during floods in N. Bengal/Assam belt",
    dek: "Forest teams, vets, and elephant squads tracked and released rhinos swept by floods—showing how fast coordination can protect wildlife.",
    lifeLesson: "Teamwork protects the vulnerable—human or wild.",
    category: "Environment",
    city: "Cooch Behar / Kaziranga range",
    state: "Assam",
    country: "IN",
    readMinutes: 3,
    publishedAt: "2025-10-17T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1564325724739-bae0bd08762c",
    sources: [
      {
        name: "Times of India (rescue round-up)",
        url: "https://timesofindia.indiatimes.com/city/kolkata/tenth-rhino-swept-away-in-n-bengal-floods-rescued/articleshow/124643737.cms",
      }
    ],
  },

  // ——— Gujarat ———
  {
    id: "gj1",
    slug: "surat-community-ditches-plastic-bottles-refill-drive",
    title: "Surat community’s refill drive makes a 35,000-person event plastic-free",
    dek: "Volunteers deployed hundreds of coolers and portable jugs, promoting reusable bottles and preventing tens of thousands of single-use bottles daily.",
    lifeLesson: "Simple systems drive big environmental wins.",
    category: "Environment",
    city: "Surat",
    state: "Gujarat",
    country: "IN",
    readMinutes: 2,
    publishedAt: "2025-10-28T12:00:00.000Z",
    heroImage: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    sources: [
      {
        name: "Times of India",
        url: "https://timesofindia.indiatimes.com/city/surat/bohra-communitys-refill-drive-makes-annual-event-plastic-free/articleshow/124430912.cms",
      },
    ],
  },
];
