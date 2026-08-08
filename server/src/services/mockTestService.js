const aiService = require('./ai.service');

// Pre-built fallback questions to guarantee instant availability if AI rate limit / token error occurs
const FALLBACK_QUESTION_BANK = {
  'Operating System (OS)': [
    {
      id: 1,
      question: "What is the primary function of an operating system?",
      options: [
        "To play video games",
        "To manage computer hardware and software resources",
        "To browse the internet",
        "To create documents"
      ],
      correctIndex: 1,
      explanation: "The operating system acts as an intermediary between the user and the hardware, managing memory, processes, and essential computing resources."
    },
    {
      id: 2,
      question: "Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?",
      options: [
        "First-Come, First-Served (FCFS)",
        "Shortest Job First (SJF)",
        "Round Robin (RR)",
        "Priority Scheduling"
      ],
      correctIndex: 1,
      explanation: "SJF (Shortest Job First) is provably optimal, providing the lowest average waiting time for a specific set of processes."
    },
    {
      id: 3,
      question: "What state does a process enter when it is waiting for an I/O operation to complete?",
      options: [
        "Ready state",
        "Running state",
        "Blocked / Waiting state",
        "Terminated state"
      ],
      correctIndex: 2,
      explanation: "When a process requests I/O, it transitions into the Blocked or Waiting state until the I/O event signals completion."
    },
    {
      id: 4,
      question: "What condition is NOT necessary for a deadlock to occur?",
      options: [
        "Mutual Exclusion",
        "Hold and Wait",
        "Preemption allowed",
        "Circular Wait"
      ],
      correctIndex: 2,
      explanation: "No Preemption (resources cannot be preempted) is one of Coffman's 4 deadlock conditions. If preemption IS allowed, deadlock is prevented."
    },
    {
      id: 5,
      question: "What is thrashing in an operating system?",
      options: [
        "Excessive CPU clock speed boost",
        "High paging activity where the system spends more time swapping pages than executing instructions",
        "Permanent hard drive failure",
        "Memory fragmentation caused by stack overflow"
      ],
      correctIndex: 1,
      explanation: "Thrashing occurs when main memory is overloaded, causing the OS to continuously swap pages in and out of disk, severely degrading CPU throughput."
    }
  ],
  'Database Management System (DBMS)': [
    {
      id: 1,
      question: "What does the 'A' in ACID properties of database transactions stand for?",
      options: [
        "Availability",
        "Atomicity",
        "Authentication",
        "Aggregation"
      ],
      correctIndex: 1,
      explanation: "Atomicity guarantees that all operations within a transaction complete successfully, or none of them are applied (all-or-nothing)."
    },
    {
      id: 2,
      question: "Which normal form removes transitive dependencies?",
      options: [
        "First Normal Form (1NF)",
        "Second Normal Form (2NF)",
        "Third Normal Form (3NF)",
        "Boyce-Codd Normal Form (BCNF)"
      ],
      correctIndex: 2,
      explanation: "A table is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key."
    },
    {
      id: 3,
      question: "Which SQL command is used to remove all rows from a table without logging individual row deletions?",
      options: [
        "DELETE",
        "DROP",
        "TRUNCATE",
        "REMOVE"
      ],
      correctIndex: 2,
      explanation: "TRUNCATE is a DDL command that deallocates data pages, removing all rows rapidly without writing individual row deletes to the transaction log."
    },
    {
      id: 4,
      question: "What type of JOIN returns all records from the left table and matched records from the right table?",
      options: [
        "INNER JOIN",
        "RIGHT JOIN",
        "LEFT JOIN",
        "FULL OUTER JOIN"
      ],
      correctIndex: 2,
      explanation: "A LEFT (OUTER) JOIN returns all rows from the left table, padding NULLs for non-matching rows in the right table."
    },
    {
      id: 5,
      question: "What is B-Tree index mainly used for in relational databases?",
      options: [
        "Storing unindexed raw text blobs",
        "Enabling logarithmic time fast range queries and key lookups",
        "Converting SQL into JSON objects",
        "Managing table replication across servers"
      ],
      correctIndex: 1,
      explanation: "B-Trees keep data sorted and allow search, sequential access, insertions, and deletions in O(log n) time."
    }
  ],
  'Computer Networks (CN)': [
    {
      id: 1,
      question: "At which layer of the OSI model does the Internet Protocol (IP) operate?",
      options: [
        "Data Link Layer",
        "Network Layer",
        "Transport Layer",
        "Session Layer"
      ],
      correctIndex: 1,
      explanation: "The IP protocol operates at Layer 3 (Network Layer) of the OSI model, handling packet routing across networks."
    },
    {
      id: 2,
      question: "Which protocol provides reliable, connection-oriented data transfer with flow control?",
      options: [
        "UDP",
        "IP",
        "TCP",
        "ICMP"
      ],
      correctIndex: 2,
      explanation: "TCP (Transmission Control Protocol) uses handshakes, sequence numbers, and acknowledgments to ensure reliable in-order transmission."
    },
    {
      id: 3,
      question: "What is the standard port number used for HTTPS traffic?",
      options: [
        "80",
        "8080",
        "443",
        "22"
      ],
      correctIndex: 2,
      explanation: "HTTPS (HTTP Secure) communicates over port 443 by default using TLS/SSL encryption."
    },
    {
      id: 4,
      question: "What is the primary function of DNS (Domain Name System)?",
      options: [
        "Encrypt web traffic between browser and server",
        "Translate human-friendly domain names into IP addresses",
        "Allocate dynamic IP addresses to devices on a LAN",
        "Filter malicious network traffic"
      ],
      correctIndex: 1,
      explanation: "DNS resolves hostnames (e.g. example.com) to computer-readable IP addresses (e.g. 193.0.2.1)."
    },
    {
      id: 5,
      question: "What mechanism does TCP use to avoid network congestion?",
      options: [
        "CSMA/CD",
        "Slow Start & Congestion Avoidance",
        "Distance Vector Routing",
        "ARP Broadcast"
      ],
      correctIndex: 1,
      explanation: "TCP manages window size dynamically using Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery."
    }
  ],
  'Data Structures & Algorithms (DSA)': [
    {
      id: 1,
      question: "What is the worst-case time complexity of Quick Sort?",
      options: [
        "O(n log n)",
        "O(n)",
        "O(n^2)",
        "O(log n)"
      ],
      correctIndex: 2,
      explanation: "Quick Sort degrades to O(n^2) when the pivot selection consistently yields unbalanced partitions (e.g. already sorted array with worst pivot choice)."
    },
    {
      id: 2,
      question: "Which data structure follows the First-In, First-Out (FIFO) principle?",
      options: [
        "Stack",
        "Queue",
        "Binary Tree",
        "Heap"
      ],
      correctIndex: 1,
      explanation: "A Queue operates on a FIFO basis where elements are enqueued at the back and dequeued from the front."
    },
    {
      id: 3,
      question: "What is the space complexity of Depth First Search (DFS) on a graph with V vertices and maximum depth H?",
      options: [
        "O(1)",
        "O(V^2)",
        "O(H) or O(V) call stack space",
        "O(E log V)"
      ],
      correctIndex: 2,
      explanation: "DFS stores vertices on the recursion call stack, requiring memory proportional to the maximum tree/graph height H (up to O(V))."
    },
    {
      id: 4,
      question: "Which data structure is optimal for implementing a priority queue?",
      options: [
        "Singly Linked List",
        "Binary Search Tree",
        "Binary Heap",
        "Hash Table"
      ],
      correctIndex: 2,
      explanation: "A Binary Heap allows inserting and extracting the minimum/maximum element in logarithmic O(log n) time."
    },
    {
      id: 5,
      question: "What algorithm is used to find the shortest path from a single source node to all other nodes in a weighted graph with non-negative weights?",
      options: [
        "Kruskal's Algorithm",
        "Dijkstra's Algorithm",
        "Floyd-Warshall Algorithm",
        "Tarjan's Algorithm"
      ],
      correctIndex: 1,
      explanation: "Dijkstra's algorithm computes single-source shortest paths efficiently using a min-priority queue."
    }
  ]
};

async function generateMockTestQuestions({ topic, category = 'topic', difficulty = 'medium', totalQuestions = 10 }) {
  const prompt = `You are a expert computer science technical interviewer creating a high-quality multiple choice question (MCQ) assessment.

TARGET SPECIFICATIONS:
- Topic / Domain: "${topic}"
- Category: ${category}
- Difficulty Level: ${difficulty} (Easy / Medium / Hard)
- Total Questions: ${totalQuestions}

INSTRUCTIONS:
1. Generate EXACTLY ${totalQuestions} unique, challenging, conceptual multiple choice questions.
2. For each question:
   - Provide clear, unambiguous question text.
   - Provide EXACTLY 4 distinct option strings in the "options" array.
   - Specify "correctIndex" (0, 1, 2, or 3) indicating which option is correct.
   - Provide a comprehensive, clear "explanation" explaining why the correct answer is right and why other choices are incorrect.
3. Output MUST strictly match JSON schema.

JSON RESPONSE FORMAT:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed step by step explanation..."
    }
  ]
}`;

  try {
    const response = await aiService.generateJSON(prompt, "You generate high-precision technical multiple choice questions in JSON format.", {
      temperature: 0.5,
      maxOutputTokens: 8192,
    });

    if (response && Array.isArray(response.questions) && response.questions.length > 0) {
      // Sanitize & validate generated questions
      const sanitized = response.questions.map((q, idx) => {
        const options = Array.isArray(q.options) && q.options.length === 4
          ? q.options.map(opt => String(opt).trim())
          : ["Option A", "Option B", "Option C", "Option D"];

        let correctIndex = Number(q.correctIndex);
        if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
          correctIndex = 0;
        }

        return {
          id: idx + 1,
          question: q.question || `Question ${idx + 1} on ${topic}`,
          options,
          correctIndex,
          explanation: q.explanation || "No detailed explanation provided."
        };
      });

      return sanitized;
    }
  } catch (err) {
    console.warn(`[MockTestService] Gemini API question generation failed or rate limited: ${err.message}. Using high-quality fallback questions.`);
  }

  // Fallback if AI generation failed
  const prebuilt = FALLBACK_QUESTION_BANK[topic] || FALLBACK_QUESTION_BANK['Operating System (OS)'];
  // Clone and scale questions if totalQuestions requested is larger
  let result = [];
  while (result.length < totalQuestions) {
    prebuilt.forEach(q => {
      if (result.length < totalQuestions) {
        result.push({
          ...q,
          id: result.length + 1
        });
      }
    });
  }
  return result;
}

module.exports = {
  generateMockTestQuestions,
  FALLBACK_QUESTION_BANK
};
