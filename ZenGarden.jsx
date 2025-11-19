import React, { useState, useEffect, useRef } from 'react';
import { Droplets, Check, Trash2, Plus, Leaf, Store, X, Sprout, Flower, Trees, Cherry, Sun, Wind } from 'lucide-react';

// --- Plant Configuration ---
const PLANT_TYPES = {
    grass: { color: 0x4ade80, scale: 0.5, height: 0.5 },
    flower_y: { color: 0xfacc15, scale: 0.8, height: 1.2, type: 'flower' },
    flower_r: { color: 0xf472b6, scale: 0.8, height: 1.2, type: 'flower' },
    cactus: { color: 0x059669, scale: 1.2, height: 1.5, type: 'cactus' },
    bamboo: { color: 0x15803d, scale: 1.0, height: 2.5, type: 'bamboo' },
    tree_s: { color: 0x16a34a, scale: 1.8, height: 3.0, type: 'tree' },
    sakura: { color: 0xf9a8d4, scale: 2.0, height: 3.5, type: 'tree_sakura' },
    bonsai: { color: 0x1e293b, scale: 1.5, height: 2.0, type: 'bonsai' },
};

const PLANTS_SHOP = [
    { id: 'grass', name: 'หญ้าอ่อน', price: 20, icon: <Sprout color="#4ade80"/> },
    { id: 'flower_y', name: 'ดอกเดซี่', price: 50, icon: <Flower color="#facc15"/> },
    { id: 'flower_r', name: 'ดอกทิวลิป', price: 80, icon: <Flower color="#f472b6"/> },
    { id: 'cactus', name: 'กระบองเพชร', price: 120, icon: <Trees color="#059669"/> },
    { id: 'bamboo', name: 'ไผ่กวนอิม', price: 200, icon: <Trees color="#15803d"/> },
    { id: 'tree_s', name: 'ไม้ยืนต้น', price: 350, icon: <Trees color="#16a34a"/> },
    { id: 'sakura', name: 'ซากุระ', price: 500, icon: <Cherry color="#f9a8d4"/> },
    { id: 'bonsai', name: 'บอนไซ', price: 800, icon: <Trees color="#1e293b"/> },
];

// Helper to load Three.js dynamically
const loadThreeJS = () => {
    return new Promise((resolve, reject) => {
        if (window.THREE) {
            resolve(window.THREE);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => resolve(window.THREE);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// --- 3D Scene Component ---
const GardenScene = ({ plants }) => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const plantsRef = useRef([]); 
    const [isThreeLoaded, setIsThreeLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        let frameId;
        let renderer;
        let scene;
        let camera;

        const init = async () => {
            try {
                const THREE = await loadThreeJS();
                setIsThreeLoaded(true);

                // 1. Setup Scene
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0xE0F2FE); // Sky blue
                scene.fog = new THREE.Fog(0xE0F2FE, 10, 50);
                sceneRef.current = scene;

                // 2. Camera
                camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
                camera.position.set(8, 8, 12);
                camera.lookAt(0, 0, 0);

                // 3. Renderer
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                containerRef.current.appendChild(renderer.domElement);

                // 4. Lighting
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                scene.add(ambientLight);

                const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
                dirLight.position.set(10, 20, 10);
                dirLight.castShadow = true;
                dirLight.shadow.mapSize.width = 2048;
                dirLight.shadow.mapSize.height = 2048;
                scene.add(dirLight);

                // 5. Ground
                const groundGeo = new THREE.CylinderGeometry(14, 14, 1, 64);
                const groundMat = new THREE.MeshStandardMaterial({ color: 0xD6D3D1 });
                const ground = new THREE.Mesh(groundGeo, groundMat);
                ground.position.y = -0.5;
                ground.receiveShadow = true;
                scene.add(ground);
                
                const grassGeo = new THREE.CircleGeometry(13.8, 64);
                const grassMat = new THREE.MeshStandardMaterial({ color: 0xECFCCB });
                const grass = new THREE.Mesh(grassGeo, grassMat);
                grass.rotation.x = -Math.PI / 2;
                grass.position.y = 0.01;
                grass.receiveShadow = true;
                scene.add(grass);

                // Initial sync of existing plants
                syncPlants(plants, THREE, scene);

                // Animation Loop
                const animate = () => {
                    const time = Date.now() * 0.001;

                    plantsRef.current.forEach((item, index) => {
                        if (item.mesh) {
                            // Growth
                            if (item.scale < 1) {
                                item.scale += 0.02;
                                if (item.scale > 1) item.scale = 1;
                                const s = item.scale;
                                item.mesh.scale.set(s, s, s);
                            }
                            // Wind
                            const windOffset = index * 0.5;
                            item.mesh.rotation.z = Math.sin(time + windOffset) * 0.05;
                            item.mesh.rotation.x = Math.cos(time * 0.8 + windOffset) * 0.05;
                        }
                    });

                    renderer.render(scene, camera);
                    frameId = requestAnimationFrame(animate);
                };
                animate();

            } catch (error) {
                console.error("Failed to load Three.js", error);
            }
        };

        init();

        const handleResize = () => {
            if (containerRef.current && renderer && camera) {
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            if (containerRef.current && renderer && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []); // Run once on mount to setup Three.js

    // Effect to sync plants when the array changes, but only after Three is loaded
    useEffect(() => {
        if (isThreeLoaded && sceneRef.current && window.THREE) {
            syncPlants(plants, window.THREE, sceneRef.current);
        }
    }, [plants, isThreeLoaded]);


    // Logic to build meshes
    const syncPlants = (currentPlants, THREE, scene) => {
        // Clear existing for simplicity in this demo (could be optimized)
        plantsRef.current.forEach(p => scene.remove(p.mesh));
        plantsRef.current = [];

        const createMaterial = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true });
        
        currentPlants.forEach(p => {
            const config = PLANT_TYPES[p.id];
            const group = new THREE.Group();

            // Mesh Construction Logic
            if (config.type === 'tree' || config.type === 'tree_sakura') {
                const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1, 6);
                const trunkMat = createMaterial(0x5d4037);
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.y = 0.5;
                trunk.castShadow = true;
                group.add(trunk);

                const leavesGeo = new THREE.DodecahedronGeometry(1);
                const leavesMat = createMaterial(config.color);
                const leaves = new THREE.Mesh(leavesGeo, leavesMat);
                leaves.position.y = 1.5;
                leaves.scale.set(1.2, 1, 1.2);
                leaves.castShadow = true;
                group.add(leaves);
            } 
            else if (config.type === 'bamboo') {
                const stemGeo = new THREE.CylinderGeometry(0.1, 0.15, 2, 5);
                const stemMat = createMaterial(config.color);
                const stem = new THREE.Mesh(stemGeo, stemMat);
                stem.position.y = 1;
                stem.castShadow = true;
                group.add(stem);
            }
            else if (config.type === 'flower') {
                const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
                const stemMat = createMaterial(0x65a30d);
                const stem = new THREE.Mesh(stemGeo, stemMat);
                stem.position.y = 0.4;
                group.add(stem);

                const headGeo = new THREE.ConeGeometry(0.3, 0.3, 5);
                const headMat = createMaterial(config.color);
                const head = new THREE.Mesh(headGeo, headMat);
                head.position.y = 0.9;
                head.rotation.x = Math.PI;
                group.add(head);
            }
            else {
                const geo = new THREE.ConeGeometry(0.2, 0.6, 5);
                const mat = createMaterial(config.color);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.y = 0.3;
                mesh.castShadow = true;
                group.add(mesh);
                
                if (p.id === 'grass') {
                    const b2 = mesh.clone();
                    b2.position.set(0.15, 0.2, 0);
                    b2.rotation.z = -0.2;
                    b2.scale.set(0.8, 0.8, 0.8);
                    group.add(b2);
                    const b3 = mesh.clone();
                    b3.position.set(-0.15, 0.25, 0.1);
                    b3.rotation.z = 0.2;
                    b3.scale.set(0.7, 0.7, 0.7);
                    group.add(b3);
                }
            }

            // Position Logic
            const seed = p.instanceId;
            const pseudoRandom = (x) => ((Math.sin(x) * 10000) % 1);
            const r = pseudoRandom(seed) * 10; 
            const theta = pseudoRandom(seed + 1) * Math.PI * 2;
            
            group.position.x = r * Math.cos(theta);
            group.position.z = r * Math.sin(theta);
            
            scene.add(group);
            
            // Init Scale 0
            group.scale.set(0,0,0);
            
            plantsRef.current.push({
                id: p.instanceId,
                mesh: group,
                scale: 0 
            });
        });
    };

    return <div ref={containerRef} className="w-full h-full bg-[#E0F2FE]" />;
};

// --- Main App Component ---
export default function App() {
    const [tasks, setTasks] = useState([]);
    const [water, setWater] = useState(0);
    const [garden, setGarden] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [filter, setFilter] = useState('all');
    const [showShop, setShowShop] = useState(false);

    // Load Data
    useEffect(() => {
        try {
            const savedTasks = localStorage.getItem('zen_tasks_3d');
            const savedWater = localStorage.getItem('zen_water_3d');
            const savedGarden = localStorage.getItem('zen_garden_3d');

            if (savedTasks) setTasks(JSON.parse(savedTasks));
            if (savedWater) setWater(parseInt(savedWater));
            if (savedGarden) setGarden(JSON.parse(savedGarden));
        } catch (e) { console.error(e); }
    }, []);

    // Save Data
    useEffect(() => {
        localStorage.setItem('zen_tasks_3d', JSON.stringify(tasks));
        localStorage.setItem('zen_water_3d', water.toString());
        localStorage.setItem('zen_garden_3d', JSON.stringify(garden));
    }, [tasks, water, garden]);

    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setTasks([{ id: Date.now(), text: newTask, completed: false }, ...tasks]);
        setNewTask('');
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => {
            if (t.id === id) {
                const isCompleting = !t.completed;
                setWater(prev => isCompleting ? prev + 10 : Math.max(0, prev - 10));
                return { ...t, completed: !t.completed };
            }
            return t;
        }));
    };

    const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

    const buyPlant = (plant) => {
        if (water >= plant.price) {
            setWater(prev => prev - plant.price);
            setGarden([...garden, { ...plant, instanceId: Date.now() }]);
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    const getProgress = () => {
        if (tasks.length === 0) return 0;
        return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row overflow-hidden font-sans bg-[#F5F5F0] text-stone-600">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap');
                body { font-family: 'Kanit', sans-serif; }
            `}</style>

            {/* --- Left Side: 3D Garden --- */}
            <div className="w-full md:w-1/2 h-[50vh] md:h-screen bg-blue-50 relative flex flex-col border-b md:border-b-0 md:border-r border-stone-200">
                
                {/* 3D Canvas Layer */}
                <div className="absolute inset-0 z-0">
                    <GardenScene plants={garden} />
                </div>

                {/* Overlay UI */}
                <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start pointer-events-none">
                    <div>
                        <h1 className="text-2xl font-semibold text-stone-700 flex items-center gap-2 drop-shadow-md">
                            <Sun className="text-orange-400" /> สวน 3D แห่งสติ
                        </h1>
                        <p className="text-sm text-stone-500 mt-1 bg-white/50 backdrop-blur-sm rounded-md px-2 py-1 inline-block">
                            <Wind className="inline w-3 h-3 mr-1" /> ลมกำลังพัดเบาๆ
                        </p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-md border border-white/50 px-4 py-2 rounded-full flex items-center gap-2 text-blue-500 font-bold shadow-lg">
                        <Droplets size={20} className="fill-current" /> 
                        <span className="text-xl">{water}</span>
                    </div>
                </div>

                {/* Shop Button */}
                <div className="absolute bottom-6 right-6 z-20">
                    <button 
                        onClick={() => setShowShop(!showShop)}
                        className="bg-stone-800 hover:bg-stone-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all active:scale-95 border-2 border-white/20"
                    >
                        {showShop ? <><X size={20} /> ปิดร้านค้า</> : <><Store size={20} /> ร้านค้า 3D</>}
                    </button>
                </div>

                {/* Shop Panel */}
                {showShop && (
                    <div className="absolute bottom-20 right-6 w-72 bg-white/95 backdrop-blur-xl border border-stone-200 rounded-2xl p-4 shadow-2xl z-20 animate-[grow_0.3s_ease-out] origin-bottom-right">
                        <h3 className="font-bold text-stone-700 mb-3 border-b border-stone-200 pb-2">เลือกเมล็ดพันธุ์</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                            {PLANTS_SHOP.map(plant => (
                                <button 
                                    key={plant.id}
                                    onClick={() => buyPlant(plant)}
                                    disabled={water < plant.price}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        water >= plant.price 
                                        ? 'border-stone-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer shadow-sm' 
                                        : 'border-transparent opacity-50 bg-stone-100 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center shadow-inner">
                                            {plant.icon}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-stone-700">{plant.name}</div>
                                            <div className="text-xs text-blue-500 font-bold">{plant.price} หยด</div>
                                        </div>
                                    </div>
                                    {water >= plant.price && (
                                        <div className="text-white bg-blue-400 p-1.5 rounded-full hover:bg-blue-500">
                                            <Plus size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- Right Side: Todo List --- */}
            <div className="w-full md:w-1/2 h-[50vh] md:h-screen bg-white flex flex-col shadow-2xl z-10 relative">
                {/* (Todo UI Logic - Same as before but refined) */}
                <div className="p-8 pb-4 bg-gradient-to-b from-white to-stone-50">
                    <h2 className="text-3xl font-bold text-stone-800 mb-1 tracking-tight">ภารกิจของคุณ</h2>
                    <div className="flex justify-between items-center text-stone-500 text-sm mb-6 font-medium">
                        <span>{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        <span>{tasks.filter(t => t.completed).length}/{tasks.length} สำเร็จ</span>
                    </div>

                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden mb-6 shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700 ease-out rounded-full"
                            style={{ width: `${getProgress()}%` }}
                        ></div>
                    </div>

                    <form onSubmit={addTask} className="relative group">
                        <input 
                            type="text" 
                            placeholder="พิมพ์สิ่งที่ต้องทำ..." 
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            className="w-full bg-white border-2 border-stone-100 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder-stone-300 text-stone-700 shadow-sm"
                        />
                        <button 
                            type="submit" 
                            disabled={!newTask.trim()}
                            className="absolute right-2 top-2 bottom-2 aspect-square bg-stone-800 hover:bg-black disabled:opacity-30 disabled:bg-stone-400 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
                        >
                            <Plus size={20} />
                        </button>
                    </form>

                    <div className="flex gap-6 mt-6 border-b border-stone-100">
                        {['all', 'active', 'completed'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`pb-3 text-sm font-medium capitalize transition-all relative ${
                                    filter === f ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'
                                }`}
                            >
                                {f === 'all' ? 'ทั้งหมด' : (f === 'active' ? 'ต้องทำ' : 'เสร็จแล้ว')}
                                {filter === f && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 rounded-t-full w-full"></span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-3">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center text-stone-300 py-12 flex flex-col items-center">
                             <Leaf className="mb-3 opacity-20" size={48} />
                            <p className="font-light">ความว่างคือความสงบ...</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div 
                                key={task.id} 
                                className={`group flex items-center p-4 rounded-2xl border transition-all duration-300 ${
                                    task.completed 
                                    ? 'bg-stone-50 border-transparent opacity-60' 
                                    : 'bg-white border-stone-100 shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5'
                                }`}
                            >
                                <button 
                                    onClick={() => toggleTask(task.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all ${
                                        task.completed 
                                        ? 'bg-green-400 border-green-400 text-white scale-110 shadow-green-200' 
                                        : 'border-stone-300 text-transparent hover:border-green-400'
                                    }`}
                                >
                                    <Check size={14} strokeWidth={3} />
                                </button>
                                
                                <span className={`flex-1 text-base transition-all ${task.completed ? 'line-through text-stone-400 decoration-stone-300' : 'text-stone-700 font-medium'}`}>
                                    {task.text}
                                </span>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                    {task.completed && (
                                        <span className="text-xs text-blue-500 mr-3 font-bold flex items-center bg-blue-50 px-2 py-1 rounded-lg">
                                            +10 <Droplets size={10} className="ml-1 fill-current"/>
                                        </span>
                                    )}
                                    <button 
                                        onClick={() => deleteTask(task.id)}
                                        className="text-stone-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
