// lib/mock.ts — Aikya stories with full sections

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
  sources?: { name: string; url: string }[];
  // NEW fields used by the Story page:
  what: string;
  how: string;
  why: string;
};

export const stories: Story[] = [
  // ——— Uttarakhand #1 ———
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
    what:
      "A highway tunnel collapsed after a landslide, leaving dozens of workers sealed in a confined stretch with limited food and air. Heavy drilling equipment struggled against unstable rock and repeated cave-ins, slowing the operation and raising concerns for the workers’ health.",
    how:
      "A small team of experienced ‘rat-hole’ miners inched forward manually. Using hand tools and low-profile braces, they crawled through a narrow pipe, carefully removing debris, stabilizing weak sections, and communicating with rescuers behind them until they reached the trapped men and helped guide them out safely.",
    why:
      "This rescue showed how traditional skills and modern coordination complement each other. When big machines reach their limits, human ingenuity, teamwork, and persistence can still prevail—and that gives communities confidence in the face of complex emergencies.",
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

  // ——— Uttarakhand #2 ———
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
    what:
      "Heavy rain led to landslides that blocked stretches of the yatra route and stranded visitors. Communication was patchy, and movement of ambulances became difficult in steep terrain.",
    how:
      "Volunteer groups set up improvised aid points near choke spots, relayed updates via local networks, and matched stranded families with safe transport. Coordination with district teams helped prioritize elderly pilgrims and medical cases.",
    why:
      "Disaster-prone regions benefit when residents train and organize in advance. Local volunteer networks reduce response time and free professional teams to tackle the toughest tasks.",
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
    what:
      "Floodwaters rose rapidly across several districts, cutting off neighborhoods and leaving people on rooftops and upper floors without supplies.",
    how:
      "Fishermen trailered their boats into inland areas and navigated narrow lanes with experience earned at sea. They transported families to relief camps and worked with officials to map high-priority pickups.",
    why:
      "Trust and skill inside a community can mobilize faster than any external help. Recognizing and integrating such local strength into formal response plans saves lives.",
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
    what:
      "Many commuters—especially women and seniors—struggle to find safe, fairly priced transport late at night.",
    how:
      "An auto driver began offering free or discounted night rides to those at risk, sharing her number publicly and responding to calls from families and hostels.",
    why:
      "Safety improves when ordinary citizens choose to be dependable. One person’s consistency can inspire others and shift neighborhood norms.",
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
    what:
      "A commuter accidentally left a small bag with documents and cash near the stairs of a metro platform.",
    how:
      "A home guard secured the area, informed the control room, checked recent CCTV frames, located a phone number in a business card, and verified ownership before handing the bag back.",
    why:
      "Transparent procedures and honest individuals together create reliability in public spaces. That reliability keeps cities functional and humane.",
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
    what:
      "Hospitals frequently face shortages, especially for rare blood groups, burdening families to arrange donors at short notice.",
    how:
      "Local NGOs and health workers organized recurring donation days around colleges and workplaces, maintaining donor lists and SMS reminders to smooth supply across the year.",
    why:
      "When giving becomes routine, emergencies feel less chaotic. Regular, voluntary participation builds a resilient health system.",
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
    what:
      "Rural families often depend on water sources with odor and visible impurities, making daily boiling expensive and unreliable.",
    how:
      "Professors co-designed a gravity unit using low-cost, locally available media and published open instructions for community testing before filing a patent.",
    why:
      "Accessible designs let communities adopt health solutions without waiting for large infrastructure projects. Open knowledge accelerates adoption.",
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
    what:
      "Power cuts left students without safe lighting during crucial study hours, pushing families back to smoky lamps.",
    how:
      "A local drive distributed durable solar lanterns, trained students on charging routines, and set up school-based repairs to keep devices working.",
    why:
      "Simple, decentralized energy solutions improve education outcomes and household health without heavy infrastructure.",
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
    what:
      "Seasonal floods displaced wildlife from protected areas, pushing animals into farmland and road corridors.",
    how:
      "Rapid-response teams used radio updates, tranquilizer support, and trained elephants to guide strays to safety while keeping crowds back.",
    why:
      "Conservation succeeds when science, field skill, and community cooperation move in sync—especially during climate-driven extremes.",
    sources: [
      {
        name: "Times of India (rescue round-up)",
        url: "https://timesofindia.indiatimes.com/city/kolkata/tenth-rhino-swept-away-in-n-bengal-floods-rescued/articleshow/124643737.cms",
      },
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
    what:
      "A large community gathering risked generating mountains of single-use plastic bottles over multiple days.",
    how:
      "Organizers set up refill stations, distributed reusable containers, and placed clear way-finding to make refilling faster than buying water.",
    why:
      "Designing for the default behavior—refill, not discard—turns sustainability into the easiest option for everyone.",
    sources: [
      {
        name: "Times of India",
        url: "https://timesofindia.indiatimes.com/city/surat/bohra-communitys-refill-drive-makes-annual-event-plastic-free/articleshow/124430912.cms",
      },
    ],
  },

  // ——— Japan (Global) ———
  {
    id: "jp1",
    slug: "ocean-cleanup-milestone-japan",
    title: "Ocean cleanup volunteers hit a plastic-removal milestone off Japan",
    dek: "Divers and shoreline teams coordinated to clear nets and bottles from a cove, logging weights and mapping hotspots to guide future cleanups.",
    lifeLesson: "Progress grows when we persist together.",
    category: "GlobalHope",
    country: "JP",
    readMinutes: 3,
    publishedAt: "2024-10-10T12:00:00.000Z",
    heroImage: "https://images.pexels.com/photos/989959/pexels-photo-989959.jpeg",
    what:
      "Near a popular cove, currents concentrated debris in difficult-to-reach pockets along rocks and seabed.",
    how:
      "Volunteer divers coordinated with shore teams using radios and mesh bags, recording material types and weights to plan repeat cleanups efficiently.",
    why:
      "Measuring results helps volunteers stay motivated and informs local policy, creating steady, scalable change.",
  },
];
