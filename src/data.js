// ========================================================
// RECURSIVE FRACTAL DATA CONTEXT TREE (4-5 NODES SCALE) - ES Module
// ========================================================
export const WorkspaceData = {
    currentScope: "root",
    activeRole: "manager",
    toolMode: "pan",
    selectedId: null,
    linkSourceId: null,
    spawnTypeMemory: "container",

    components: [
        { id: "CAT-NOD-01", parentId: "root", type: "container", title: "Backend Infrastructure", teamScope: "backend", assignee: "Rohit G.", reporter: "Sarthak G.", initiated: "2026-05-10", deadline: "2026-05-28", complexity: 5, importance: 4, isDone: false, top: 80, left: 60 },
        { id: "CAT-NOD-02", parentId: "root", type: "container", title: "Frontend Client System", teamScope: "frontend", assignee: "Priya S.", reporter: "Sarthak G.", initiated: "2026-05-12", deadline: "2026-06-01", complexity: 4, importance: 3, isDone: false, top: 340, left: 60 },
        { id: "CAT-NOD-03", parentId: "root", type: "container", title: "DevOps & Deployment Shards", teamScope: "ops", assignee: "Kunal M.", reporter: "Sarthak G.", initiated: "2026-05-14", deadline: "2026-06-10", complexity: 6, importance: 5, isDone: false, top: 210, left: 440 },
        { id: "CAT-TCK-01", parentId: "root", type: "ticket", title: "Map Architectural Topologies", teamScope: "backend", assignee: "Arjun K.", reporter: "Priya S.", initiated: "2026-05-01", deadline: "2026-05-15", complexity: 2, importance: 5, isDone: true, top: 80, left: 440 },

        { id: "CAT-SUB-NOD-01", parentId: "CAT-NOD-01", type: "container", title: "Database Schema Creation", teamScope: "backend", assignee: "Rohit G.", reporter: "System Arch", initiated: "2026-05-11", deadline: "2026-05-20", complexity: 8, importance: 5, isDone: false, top: 70, left: 60 },
        { id: "CAT-SUB-NOD-02", parentId: "CAT-NOD-01", type: "container", title: "API Contract Infrastructure", teamScope: "backend", assignee: "Amit S.", reporter: "Rohit G.", initiated: "2026-05-12", deadline: "2026-05-25", complexity: 5, importance: 4, isDone: false, top: 290, left: 60 },
        { id: "CAT-SUB-TCK-01", parentId: "CAT-NOD-01", type: "ticket", title: "Configure Redis Cluster Replicas", teamScope: "backend", assignee: "Vikram N.", reporter: "Rohit G.", initiated: "2026-05-14", deadline: "2026-05-22", complexity: 4, importance: 4, isDone: true, top: 180, left: 440 },

        { id: "CAT-DEEP-TCK-01", parentId: "CAT-SUB-NOD-01", type: "ticket", title: "Initialize PostgreSQL Tables", teamScope: "backend", assignee: "Rohit G.", reporter: "System Arch", initiated: "2026-05-11", deadline: "2026-05-17", complexity: 6, importance: 5, isDone: true, top: 90, left: 80 },
        { id: "CAT-DEEP-TCK-02", parentId: "CAT-SUB-NOD-01", type: "ticket", title: "Run Heavy High-Availability Tests", teamScope: "backend", assignee: "Amit S.", reporter: "Rohit G.", initiated: "2026-05-13", deadline: "2026-05-19", complexity: 7, importance: 4, isDone: false, top: 240, left: 440 }
    ],

    crossDependencies: [
        { source: "CAT-NOD-01", target: "CAT-NOD-02" }
    ]
};

export default WorkspaceData;
