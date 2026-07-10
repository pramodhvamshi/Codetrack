const fs = require('fs');
const path = require('path');

const striverSheetData = {
  title: "Striver A2Z",
  description: "Comprehensive DSA practice sheet for product based companies",
  version: 1,
  source: "striver",
  sourceVersion: "2026-07",
  categories: [
    {
      title: "Step 1: Learn the basics",
      order: 1,
      problems: [
        {
          title: "User Input / Output",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/two-sum/",
          order: 1,
          resources: [
            { title: "Basics of C++ Video", url: "https://www.youtube.com/watch?v=EAR7De6Gv4Y", type: "video", isPremium: false },
            { title: "Documentation: C++ Basics", url: "https://en.cppreference.com/w/cpp", type: "documentation", isPremium: false }
          ]
        },
        {
          title: "Basic Maths: Count Digits",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/palindrome-number/",
          order: 2,
          resources: [
            { title: "Count Digits Article", url: "https://takeuforward.org/maths/count-digits-in-a-number/", type: "article", isPremium: false }
          ]
        },
        {
          title: "Basic Recursion: Print N to 1",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/fibonacci-number/",
          order: 3,
          resources: [
            { title: "Recursion Basics Video", url: "https://www.youtube.com/watch?v=yVdKa8dnKiE", type: "video", isPremium: false }
          ]
        }
      ]
    },
    {
      title: "Step 2: Sorting Techniques",
      order: 2,
      problems: [
        {
          title: "Selection Sort",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/sort-an-array/",
          order: 1,
          resources: [
            { title: "Selection Sort Tutorial", url: "https://www.youtube.com/watch?v=g-PGLbMth_g", type: "video", isPremium: false }
          ]
        },
        {
          title: "Bubble Sort",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/sort-colors/",
          order: 2,
          resources: [
            { title: "Bubble Sort Theory", url: "https://www.youtube.com/watch?v=PkJIc8geaB4", type: "video", isPremium: false }
          ]
        },
        {
          title: "Merge Sort",
          difficulty: "Medium",
          leetcodeUrl: "https://leetcode.com/problems/sort-an-array/",
          order: 3,
          resources: [
            { title: "Merge Sort Visual Guide", url: "https://www.youtube.com/watch?v=ogytlB90ry8", type: "video", isPremium: false }
          ]
        }
      ]
    },
    {
      title: "Step 3: Solve Problems on Arrays",
      order: 3,
      problems: [
        {
          title: "Largest Element in Array",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/third-maximum-number/",
          order: 1,
          resources: [
            { title: "Array Coding Practice", url: "https://takeuforward.org/data-structure/find-the-largest-element-in-an-array/", type: "practice", isPremium: false }
          ]
        },
        {
          title: "Remove Duplicates from Sorted Array",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
          order: 2,
          resources: [
            { title: "Remove Duplicates Video", url: "https://www.youtube.com/watch?v=Fm_p9lJ4Z_8", type: "video", isPremium: false }
          ]
        },
        {
          title: "Two Sum",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/two-sum/",
          order: 3,
          resources: [
            { title: "Two Sum Article", url: "https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/", type: "article", isPremium: false }
          ]
        },
        {
          title: "3Sum",
          difficulty: "Medium",
          leetcodeUrl: "https://leetcode.com/problems/3sum/",
          order: 4,
          resources: [
            { title: "3Sum Complete Walkthrough", url: "https://www.youtube.com/watch?v=DhFh8Kw7ymk", type: "video", isPremium: false }
          ]
        }
      ]
    },
    {
      title: "Step 4: Binary Search",
      order: 4,
      problems: [
        {
          title: "Binary Search Implementation",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/binary-search/",
          order: 1,
          resources: [
            { title: "Binary Search Video", url: "https://www.youtube.com/watch?v=C2apEw9pgtw", type: "video", isPremium: false }
          ]
        },
        {
          title: "Search Insert Position",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/search-insert-position/",
          order: 2,
          resources: [
            { title: "Search Insert Article", url: "https://takeuforward.org/binary-search/search-insert-position/", type: "article", isPremium: false }
          ]
        }
      ]
    },
    {
      title: "Step 6: Learn LinkedList",
      order: 5,
      problems: [
        {
          title: "Reverse LinkedList",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list/",
          order: 1,
          resources: [
            { title: "Reverse LinkedList Tutorial", url: "https://www.youtube.com/watch?v=iT1Yrv3mU1w", type: "video", isPremium: false }
          ]
        },
        {
          title: "Detect Loop in LinkedList",
          difficulty: "Medium",
          leetcodeUrl: "https://leetcode.com/problems/linked-list-cycle/",
          order: 2,
          resources: [
            { title: "LinkedList Cycle Video", url: "https://www.youtube.com/watch?v=35EtJTO5Jps", type: "video", isPremium: false }
          ]
        }
      ]
    },
    {
      title: "Step 13: Binary Trees",
      order: 6,
      problems: [
        {
          title: "Inorder Traversal",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
          order: 1,
          resources: [
            { title: "Binary Tree Inorder traversal", url: "https://takeuforward.org/data-structure/inorder-traversal-of-binary-tree/", type: "article", isPremium: false }
          ]
        },
        {
          title: "Max Depth of Binary Tree",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
          order: 2,
          resources: [
            { title: "Tree Max Depth Video", url: "https://www.youtube.com/watch?v=eD3tmO66dSE", type: "video", isPremium: false }
          ]
        }
      ]
    },
    {
      title: "Step 16: Dynamic Programming",
      order: 7,
      problems: [
        {
          title: "Climbing Stairs",
          difficulty: "Easy",
          leetcodeUrl: "https://leetcode.com/problems/climbing-stairs/",
          order: 1,
          resources: [
            { title: "Climbing Stairs explanation", url: "https://www.youtube.com/watch?v=mLfjzJs2UAo", type: "video", isPremium: false }
          ]
        },
        {
          title: "Longest Common Subsequence",
          difficulty: "Medium",
          leetcodeUrl: "https://leetcode.com/problems/longest-common-subsequence/",
          order: 2,
          resources: [
            { title: "LCS DP Tutorial", url: "https://www.youtube.com/watch?v=NPv91xOehp8", type: "video", isPremium: false }
          ]
        }
      ]
    }
  ]
};

const outputDir = path.join(__dirname, '..', 'seed', 'dsa');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'striver.json'),
  JSON.stringify(striverSheetData, null, 2)
);

console.log("Striver A2Z curriculum JSON extracted successfully to seed/dsa/striver.json");
