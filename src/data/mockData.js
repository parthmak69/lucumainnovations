import { 
  FiGlobe, FiSmartphone, FiShield, FiDatabase, FiCpu, FiCloud, 
  FiLayers, FiSettings, FiTrendingUp, FiGitPullRequest, FiClock, FiCheckCircle 
} from 'react-icons/fi';

export const servicesData = [
  {
    id: 'web-dev',
    title: 'Custom Web Development',
    category: 'web',
    description: 'Bespoke, high-performance web applications built with React, Next.js, and modern frontend stacks. Scalable, responsive, and SEO-optimized.',
    icon: FiGlobe,
    features: ['Single Page Apps (SPAs)', 'Server-Side Rendering (SSR)', 'Progressive Web Apps (PWAs)', 'Headless CMS Integration'],
    basePrice: 2500,
    timeframeWeeks: 4
  },
  {
    id: 'android-dev',
    title: 'Android App Development',
    category: 'mobile',
    description: 'Native Android applications engineered for fluid performance, security, and integration with the latest Android system features.',
    icon: FiSmartphone,
    features: ['Native Kotlin Development', 'Google Play Store deployment', 'Material 3 Design Guidelines', 'Device hardware integration'],
    basePrice: 3500,
    timeframeWeeks: 6
  },
  {
    id: 'ios-dev',
    title: 'iOS App Development',
    category: 'mobile',
    description: 'Premium iOS applications crafted with Swift and SwiftUI, delivering a pixel-perfect, native Apple ecosystem experience.',
    icon: FiSmartphone,
    features: ['Swift & SwiftUI architecture', 'Apple App Store publishing', 'Apple Pay & iCloud integration', 'iPad & Watch support'],
    basePrice: 4000,
    timeframeWeeks: 6
  },
  {
    id: 'ui-ux',
    title: 'UI/UX Design',
    category: 'design',
    description: 'Stunning visual interfaces and user experiences designed to engage, convert, and feel premium. High-fidelity wireframes and interactive prototypes.',
    icon: FiLayers,
    features: ['User research & journey mapping', 'Figma design files', 'Interactive prototypes', 'Design systems creation'],
    basePrice: 1500,
    timeframeWeeks: 3
  },
  {
    id: 'backend',
    title: 'Backend Development',
    category: 'backend',
    description: 'Robust server-side logic and database architecture using Node.js, Express, Python, or Go. Engineered to handle high concurrent traffic.',
    icon: FiCpu,
    features: ['Express.js & NestJS frameworks', 'Microservices architecture', 'Serverless functions', 'Real-time WebSockets'],
    basePrice: 3000,
    timeframeWeeks: 5
  },
  {
    id: 'rest-apis',
    title: 'REST & GraphQL APIs',
    category: 'backend',
    description: 'Secure, fast, and scalable API layers. Fully documented using Swagger/OpenAPI, allowing frontends to connect seamlessly.',
    icon: FiGitPullRequest,
    features: ['RESTful standards', 'GraphQL endpoints', 'OAuth2 & JWT security', 'Rate limiting & caching'],
    basePrice: 2000,
    timeframeWeeks: 3
  },
  {
    id: 'cloud-hosting',
    title: 'Cloud Hosting Integration',
    category: 'cloud',
    description: 'AWS, Google Cloud, and Azure hosting setup. Automated container deployments, scaling triggers, and continuous delivery setups.',
    icon: FiCloud,
    features: ['Amazon Web Services (AWS)', 'Docker & Kubernetes containerization', 'CI/CD pipeline configuration', 'Serverless deployment'],
    basePrice: 1800,
    timeframeWeeks: 3
  },
  {
    id: 'vps-hosting',
    title: 'VPS & Dedicated Server Setup',
    category: 'cloud',
    description: 'High-availability Virtual Private Servers (VPS) and dedicated hosting configurations. Optimized for uptime, speed, and isolated security.',
    icon: FiShield,
    features: ['Nginx & Apache optimization', 'Linux server hardening', 'Automated backups', 'SSL/TLS configuration'],
    basePrice: 1200,
    timeframeWeeks: 2
  },
  {
    id: 'database-design',
    title: 'Database Design & Management',
    category: 'backend',
    description: 'Performance-tuned Relational (PostgreSQL, MySQL) and NoSQL (MongoDB, Redis) databases. Secure data storage and structured relationships.',
    icon: FiDatabase,
    features: ['Data schemas & indexing', 'MongoDB & PostgreSQL expertise', 'Data replication & migration', 'Query execution optimization'],
    basePrice: 2200,
    timeframeWeeks: 3
  },
  {
    id: 'website-maintenance',
    title: 'Website Maintenance',
    category: 'design',
    description: 'Ongoing technical support, security patches, plugin updates, and regular backup scheduling to keep your web assets healthy.',
    icon: FiClock,
    features: ['Monthly security audits', 'Core framework updates', 'Weekly backup storage', 'Priority bug fixing support'],
    basePrice: 300, // Monthly retainer
    timeframeWeeks: 1 // Ongoing
  },
  {
    id: 'optimization',
    title: 'Performance Optimization',
    category: 'design',
    description: 'Accelerate slow load times. Code-splitting, asset compression, caching strategies, and database query optimization to hit 100/100 on Lighthouse.',
    icon: FiTrendingUp,
    features: ['Lighthouse optimization audits', 'Image compression pipelines', 'Core Web Vitals remediation', 'Lazy loading & bundle reduction'],
    basePrice: 1500,
    timeframeWeeks: 2
  },
  {
    id: 'business-automation',
    title: 'Business Automation Solutions',
    category: 'design',
    description: 'Automate tedious administrative pipelines. Custom dashboard scripting, CRM connections, web scrapers, and third-party API orchestration.',
    icon: FiSettings,
    features: ['Stripe payment workflows', 'HubSpot & Salesforce automation', 'Slack/Discord alert integration', 'Custom scraping & ETL pipelines'],
    basePrice: 2800,
    timeframeWeeks: 4
  }
];

export const whyChooseUsData = [
  {
    title: 'Experienced Developers',
    description: 'Our founders and developers bring years of code dedication, combining academic knowledge with rigorous self-taught experience.',
    icon: FiCpu,
  },
  {
    title: 'Modern Technologies',
    description: 'We build exclusively with state-of-the-art frameworks like React 19, Tailwind v4, Vite, Node.js, and Serverless cloud architectures.',
    icon: FiGlobe,
  },
  {
    title: 'Fast Delivery',
    description: 'Our agile sprint cycle means rapid prototyping, weekly reviews, and fast deployment times without sacrificing quality.',
    icon: FiClock,
  },
  {
    title: 'Scalable Architecture',
    description: 'We write modular code designed to scale from 10 users to 10 million. Database designs that prevent bottleneck delays.',
    icon: FiLayers,
  },
  {
    title: 'Secure Solutions',
    description: 'Industry-standard practices: JWT-only authentication, data encryption, secured server configurations, and CSRF protection.',
    icon: FiShield,
  },
  {
    title: 'Long-Term Support',
    description: 'We do not launch and disappear. Every client receives hands-on training and ongoing maintenance retainer packages.',
    icon: FiCheckCircle,
  }
];

export const processSteps = [
  {
    step: '01',
    title: 'Consultation',
    description: 'We sit down (virtually) to discuss your business requirements, project ideas, target audience, and feature necessities.'
  },
  {
    step: '02',
    title: 'Planning & Strategy',
    description: 'Drafting detailed functional specifications, site maps, project architectures, database schemas, and setting milestones.'
  },
  {
    step: '03',
    title: 'UI/UX Design',
    description: 'Crafting responsive, stunning Figma wireframes and high-fidelity prototypes following modern neumorphic & glass design standards.'
  },
  {
    step: '04',
    title: 'Development',
    description: 'Writing clean, documented JavaScript React components and secure server APIs, maintaining a structured, modular MERN framework.'
  },
  {
    step: '05',
    title: 'Testing & QA',
    description: 'Rigorous validation including cross-browser testing, device responsive audits, page load speed optimization, and edge-case fixing.'
  },
  {
    step: '06',
    title: 'Deployment & Launch',
    description: 'Deploying servers, setting up SSL certificates, configuring domain DNS records, and launching live to cloud servers.'
  },
  {
    step: '07',
    title: 'Ongoing Support',
    description: 'Reviewing user metrics, conducting backup security checks, performing software version updates, and scaling server resources.'
  }
];

export const clientsData = [
  { name: 'Alpha Corp', industry: 'Logistics', logoText: 'α Alpha' },
  { name: 'Nova Systems', industry: 'FinTech', logoText: '★ Nova' },
  { name: 'Pixel Works', industry: 'Creative Agency', logoText: '▤ Pixel' },
  { name: 'Future Labs', industry: 'AI Research', logoText: '⚏ Future' },
  { name: 'BlueNova', industry: 'Healthcare Tech', logoText: '◆ BlueNova' }
];

export const statsData = [
  { value: 50, suffix: '+', label: 'Projects Completed' },
  { value: 25, suffix: '+', label: 'Happy Clients' },
  { value: 5, suffix: '+', label: 'Years Experience' },
  { value: 99, suffix: '%', label: 'Client Satisfaction' }
];

export const testimonialsData = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    role: 'CTO, Nova Systems',
    quote: 'Lucuma Innovation exceeded all our expectations. They took our legacy platform and completely rebuilt it into a lightning-fast React application. Their understanding of modern architectures is outstanding.',
    rating: 5,
    avatarColor: 'from-violet-500 to-indigo-500'
  },
  {
    id: 2,
    name: 'Marcus Thorne',
    role: 'Founder, Future Labs',
    quote: 'The team at Lucuma Innovation shows an ambition and technical proficiency that rivals agencies ten times their size. They delivered our AI-dashboard two weeks ahead of schedule and the UI is incredibly polished.',
    rating: 5,
    avatarColor: 'from-fuchsia-500 to-purple-500'
  },
  {
    id: 3,
    name: 'Elena Rostova',
    role: 'Product Director, Pixel Works',
    quote: 'Working with these developers was a breath of fresh air. They bring a youthful energy combined with serious engineering discipline. The custom automation solution they built saves us 15+ hours weekly.',
    rating: 5,
    avatarColor: 'from-purple-500 to-pink-500'
  }
];
