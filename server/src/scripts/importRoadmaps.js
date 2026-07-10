const fs = require('fs');
const path = require('path');
const https = require('https');

const roadmaps = [
  { id: 'frontend', title: 'Frontend Developer', icon: 'Monitor' },
  { id: 'backend', title: 'Backend Developer', icon: 'Server' },
  { id: 'ai', title: 'AI Engineer', icon: 'Brain' },
  { id: 'devops', title: 'DevOps', icon: 'Cpu' }
];

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NodeJS-Scraper' } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch: Status code ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', err => reject(err));
  });
};

// Rich offline layouts as fallback if network fails
const offlineFallbacks = {
  frontend: {
    title: "Frontend Developer",
    description: "Step by step guide to becoming a modern frontend developer in 2026",
    icon: "Monitor",
    version: 1,
    source: "roadmap.sh",
    sourceVersion: "2026-07",
    nodes: [
      { id: "internet", parentId: null, title: "Internet", description: "How the Internet works, HTTP, DNS, domains", nodeType: "group", x: 250, y: 30, width: 340, height: 180 },
      { id: "internet_what", parentId: "internet", title: "How does the Internet work?", description: "High-level understanding of packet routing and servers", nodeType: "topic", x: 280, y: 80, width: 220, height: 50, resources: [
        { title: "Internet Video", url: "https://www.youtube.com/watch?v=7_LPdttKXPc", type: "video" }
      ]},
      { id: "html", parentId: null, title: "HTML Basics", description: "Semantic tags, forms, and attributes", nodeType: "topic", x: 100, y: 250, width: 200, height: 60, resources: [
        { title: "HTML MDN Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", type: "documentation" }
      ]},
      { id: "css", parentId: null, title: "CSS Styles", description: "Flexbox, Grid, Media Queries, Responsive UI", nodeType: "topic", x: 340, y: 250, width: 200, height: 60, resources: [
        { title: "CSS Grid Guide", url: "https://css-tricks.com/snippets/css/complete-guide-grid/", type: "article" }
      ]},
      { id: "javascript", parentId: null, title: "JavaScript ES6+", description: "DOM API, Fetch, promises, variables, prototypes", nodeType: "topic", x: 580, y: 250, width: 200, height: 60, resources: [
        { title: "JS Info Tutorial", url: "https://javascript.info/", type: "documentation" }
      ]},
      { id: "git", parentId: null, title: "Version Control (Git)", description: "Git commits, branching, pull requests, github hosting", nodeType: "topic", x: 340, y: 380, width: 200, height: 60, resources: [
        { title: "Git Tutorial Video", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", type: "video" }
      ]},
      { id: "package_managers", parentId: null, title: "Package Managers", description: "npm, yarn, pnpm dependencies", nodeType: "topic", x: 100, y: 490, width: 200, height: 60 },
      { id: "build_tools", parentId: null, title: "Build Tools", description: "Vite, bundlers, linters, formatter config", nodeType: "topic", x: 340, y: 490, width: 200, height: 60 },
      { id: "react", parentId: null, title: "Frameworks (React)", description: "Virtual DOM, JSX, props, state, components, hooks", nodeType: "topic", x: 580, y: 490, width: 200, height: 60, resources: [
        { title: "React Official Docs", url: "https://react.dev/", type: "official_docs" }
      ]}
    ],
    edges: [
      { sourceNodeId: "internet_what", targetNodeId: "html" },
      { sourceNodeId: "internet_what", targetNodeId: "css" },
      { sourceNodeId: "internet_what", targetNodeId: "javascript" },
      { sourceNodeId: "javascript", targetNodeId: "git" },
      { sourceNodeId: "git", targetNodeId: "package_managers" },
      { sourceNodeId: "git", targetNodeId: "build_tools" },
      { sourceNodeId: "git", targetNodeId: "react" }
    ]
  },
  backend: {
    title: "Backend Developer",
    description: "Step by step guide to becoming a backend developer in 2026",
    icon: "Server",
    version: 1,
    source: "roadmap.sh",
    sourceVersion: "2026-07",
    nodes: [
      { id: "internet_be", parentId: null, title: "Internet Basics", description: "How does the internet work, HTTP, API design principles", nodeType: "topic", x: 340, y: 40, width: 200, height: 60 },
      { id: "language", parentId: null, title: "Pick a Language", description: "Learn Node.js, Python, Java, or Go", nodeType: "topic", x: 340, y: 160, width: 200, height: 60 },
      { id: "relational_db", parentId: null, title: "Relational Databases", description: "PostgreSQL, MySQL queries, schemas, indexing", nodeType: "topic", x: 180, y: 280, width: 200, height: 60 },
      { id: "nosql_db", parentId: null, title: "NoSQL Databases", description: "MongoDB, Redis document storage", nodeType: "topic", x: 500, y: 280, width: 200, height: 60 },
      { id: "apis", parentId: null, title: "APIs (REST & GraphQL)", description: "Endpoints, controllers, status codes", nodeType: "topic", x: 340, y: 400, width: 200, height: 60 }
    ],
    edges: [
      { sourceNodeId: "internet_be", targetNodeId: "language" },
      { sourceNodeId: "language", targetNodeId: "relational_db" },
      { sourceNodeId: "language", targetNodeId: "nosql_db" },
      { sourceNodeId: "relational_db", targetNodeId: "apis" },
      { sourceNodeId: "nosql_db", targetNodeId: "apis" }
    ]
  },
  ai: {
    title: "AI Engineer",
    description: "Path to learning Machine Learning and Generative AI",
    icon: "Brain",
    version: 1,
    source: "roadmap.sh",
    sourceVersion: "2026-07",
    nodes: [
      { id: "python_ai", parentId: null, title: "Programming (Python)", description: "Python fundamentals, NumPy, Pandas", nodeType: "topic", x: 340, y: 40, width: 200, height: 60 },
      { id: "maths", parentId: null, title: "Mathematics", description: "Calculus, Linear Algebra, Probability, Statistics", nodeType: "topic", x: 340, y: 160, width: 200, height: 60 },
      { id: "ml_basics", parentId: null, title: "Machine Learning Basics", description: "Supervised and Unsupervised Learning models", nodeType: "topic", x: 340, y: 280, width: 200, height: 60 },
      { id: "deep_learning", parentId: null, title: "Deep Learning & Neural Networks", description: "ANN, CNN, RNN, PyTorch, TensorFlow", nodeType: "topic", x: 340, y: 400, width: 200, height: 60 },
      { id: "gen_ai", parentId: null, title: "Generative AI & LLMs", description: "Transformers, GPT, RAG, Prompt Engineering, Gemini API", nodeType: "topic", x: 340, y: 520, width: 200, height: 60 }
    ],
    edges: [
      { sourceNodeId: "python_ai", targetNodeId: "maths" },
      { sourceNodeId: "maths", targetNodeId: "ml_basics" },
      { sourceNodeId: "ml_basics", targetNodeId: "deep_learning" },
      { sourceNodeId: "deep_learning", targetNodeId: "gen_ai" }
    ]
  },
  devops: {
    title: "DevOps",
    description: "Guide to system administration, cloud, and CI/CD operations",
    icon: "Cpu",
    version: 1,
    source: "roadmap.sh",
    sourceVersion: "2026-07",
    nodes: [
      { id: "os", parentId: null, title: "Operating Systems", description: "Linux command line, processes, threads, bash scripting", nodeType: "topic", x: 340, y: 40, width: 200, height: 60 },
      { id: "networking", parentId: null, title: "Networking & Security", description: "DNS, SSH, HTTP, Firewall setup", nodeType: "topic", x: 340, y: 160, width: 200, height: 60 },
      { id: "containers", parentId: null, title: "Containerization (Docker)", description: "Dockerfiles, volumes, networks, compose", nodeType: "topic", x: 340, y: 280, width: 200, height: 60 },
      { id: "cicd", parentId: null, title: "CI/CD Pipelines", description: "GitHub Actions, Jenkins pipelines, automation", nodeType: "topic", x: 340, y: 400, width: 200, height: 60 },
      { id: "iac", parentId: null, title: "Infrastructure as Code", description: "Terraform configurations, Ansible automation", nodeType: "topic", x: 340, y: 520, width: 200, height: 60 }
    ],
    edges: [
      { sourceNodeId: "os", targetNodeId: "networking" },
      { sourceNodeId: "networking", targetNodeId: "containers" },
      { sourceNodeId: "containers", targetNodeId: "cicd" },
      { sourceNodeId: "cicd", targetNodeId: "iac" }
    ]
  }
};

const outputDir = path.join(__dirname, '..', 'seed', 'roadmaps');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const runScraper = async () => {
  for (const r of roadmaps) {
    let liveData = null;
    const urls = [
      `https://raw.githubusercontent.com/nilbuild/developer-roadmap/main/src/data/roadmaps/${r.id}/${r.id}.json`,
      `https://raw.githubusercontent.com/nilbuild/developer-roadmap/master/src/data/roadmaps/${r.id}/${r.id}.json`,
      `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/main/src/data/roadmaps/${r.id}/${r.id}.json`,
      `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/${r.id}/${r.id}.json`
    ];

    console.log(`Scraping raw JSON structure for: ${r.title} from GitHub repositories...`);

    for (const url of urls) {
      try {
        liveData = await fetchJson(url);
        if (liveData) {
          console.log(`[OK] Successfully downloaded ${r.title} layout data from: ${url}`);
          break;
        }
      } catch (err) {
        // Silent catch to try next url in line
      }
    }

    try {
      if (!liveData) {
        throw new Error("All URL fetch attempts failed (Check connection or URL paths)");
      }

      // Convert React Flow representation to our schema structure
      const parsedNodes = [];
      const parsedEdges = [];

      // Loop through React Flow nodes
      if (liveData.nodes) {
        liveData.nodes.forEach(node => {
          let nodeType = 'topic';
          if (node.type === 'group' || node.id.includes('-group')) nodeType = 'group';
          else if (node.type === 'subtopic') nodeType = 'subtopic';

          parsedNodes.push({
            id: node.id,
            parentId: node.parentId || null,
            title: node.data?.label || node.label || 'Node',
            description: node.data?.description || '',
            nodeType: nodeType,
            isOptional: node.data?.isOptional || false,
            x: Math.round(node.position?.x || 0),
            y: Math.round(node.position?.y || 0),
            width: node.width || 220,
            height: node.height || 60,
            resources: node.data?.resources || []
          });
        });
      }

      // Loop through React Flow edges
      if (liveData.edges) {
        liveData.edges.forEach(edge => {
          parsedEdges.push({
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            style: edge.style?.strokeDasharray ? 'dashed' : 'solid'
          });
        });
      }

      const normalizedRoadmap = {
        title: r.title,
        description: liveData.description || `Learning path for ${r.title}`,
        icon: r.icon,
        version: 1,
        source: "roadmap.sh",
        sourceVersion: "2026-07",
        nodes: parsedNodes,
        edges: parsedEdges
      };

      fs.writeFileSync(
        path.join(outputDir, `${r.id}.json`),
        JSON.stringify(normalizedRoadmap, null, 2)
      );

    } catch (err) {
      console.warn(`[WARNING] Failed to scrape ${r.title} dynamically. Falling back to local offline structure. Error: ${err.message}`);
      
      // Save offline fallback structures
      const fallback = offlineFallbacks[r.id];
      fs.writeFileSync(
        path.join(outputDir, `${r.id}.json`),
        JSON.stringify(fallback, null, 2)
      );
    }
  }
  console.log("One-time roadmap configuration build completed.");
  process.exit(0);
};

runScraper();
