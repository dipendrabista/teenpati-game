'use client';
import React from 'react';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, RoundedBox, ContactShadows, Reflector } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState } from 'react';
import { GameState } from '@/types/game';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Trophy, Coins } from 'lucide-react';

interface RoundTable3DProps {
  gameState: GameState;
  currentPlayerId: string;
  onSeatRequest?: (position: number) => void;
  isAdmin?: boolean;
  onStartGame?: () => void;
  gameId?: string;
  hidePot?: boolean;
}

export default function RoundTable3D(props: RoundTable3DProps) {
  const { gameState, currentPlayerId } = props;
  const seatRequestCbLocal = props.onSeatRequest;
  const startGameLocal = props.onStartGame;
  const isAdminLocal = !!props.isAdmin;
  const gameIdProp = props.gameId;
  const hidePot = !!props.hidePot;
  // Responsive scene scale for mobile
  const [sceneScale, setSceneScale] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const compute = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      if (w < 360) return 0.78;
      if (w < 400) return 0.82;
      if (w < 480) return 0.88;
      if (w < 640) return 0.94;
      return 1;
    };
    const apply = () => setSceneScale(compute());
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  useEffect(() => {
    try {
      const v = localStorage.getItem('reduce_motion') === '1' || document.documentElement.classList.contains('reduce-motion');
      setReduceMotion(v);
    } catch {}
  }, []);

  return (
    <div className="w-full h-[50vh] sm:h-[620px] relative">
      <Canvas 
        shadows 
        camera={{ position: [0, 9, 14], fov: 50 }}
        onCreated={({ gl }) => {
          (gl as any).physicallyCorrectLights = true;
          (gl as any).outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping as any;
          (gl as any).toneMappingExposure = 1.05;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap as any;
        }}
      >
        <Suspense fallback={null}>
          <group scale={[sceneScale, sceneScale, sceneScale]}>
          {/* Enhanced Lighting Setup */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 15, 10]} 
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[0, 12, 0]} intensity={1.2} color="#fff5e1" />
          <spotLight position={[5, 10, 5]} angle={0.5} intensity={0.8} castShadow />
          <spotLight position={[-5, 10, -5]} angle={0.5} intensity={0.8} />
          
          {/* Environment removed to avoid remote HDR fetch issues; using lights only */}
          <hemisphereLight args={["#bcd2ff", "#2a1810", 0.4]} />
          
          {/* Game Scene */}
          <GameScene3D gameState={gameState} currentPlayerId={currentPlayerId} hidePot={hidePot} isAdmin={isAdminLocal} />
          
          {/* Enhanced Camera Controls */}
          <OrbitControls 
            enablePan={false}
            minDistance={12}
            maxDistance={30}
            maxPolarAngle={Math.PI / 2.3}
            minPolarAngle={Math.PI / 8}
            enableDamping
            dampingFactor={0.05}
          />
          {/* Soft contact shadows under table/cards/chips */}
          {!reduceMotion && <ContactShadows position={[0, -5.05, 0]} opacity={0.4} width={20} height={20} blur={2.5} far={12} />}
          </group>
        </Suspense>
      </Canvas>
      
      {/* UI Overlay removed per request */}
      {/* Host-only Start button - bottom-right overlay (ensure above chat) */}
      {props.gameState.status === 'waiting' && (
        (((props.gameState as any)?.hostId && (props.gameState as any)?.hostId === props.currentPlayerId) ||
         (!((props.gameState as any)?.hostId) && (props.gameState.players?.[0]?.id === props.currentPlayerId)))
      ) && (
        <div className="absolute bottom-5 right-5 z-[70] pointer-events-auto">
          {(() => {
            const playersLen = (props.gameState.players?.length || 0);
            const botCount = (props.gameState as any)?.botCount || 0;
            const canStart = playersLen >= 2 || botCount > 0;
            const title = playersLen >= 2 ? 'Start Game' : (botCount > 0 ? 'Start (bots will fill seats)' : 'Need one more player');
            return (
              <button
                onClick={() => {
                  try {
                    (window as any).__onStartGame && (window as any).__onStartGame();
                  } catch {}
                }}
                className={`px-4 py-2 text-sm font-bold rounded-full text-white shadow-lg border ${canStart ? 'bg-green-600 hover:bg-green-700 border-green-500/50' : 'bg-gray-500 border-gray-400 cursor-not-allowed opacity-80'}`}
                title={title}
                disabled={!canStart}
              >
                Start Game
              </button>
            );
          })()}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-xl" style={{background:"radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.18) 100%)"}} />
    </div>
  );
}

function GameScene3D({ gameState, currentPlayerId, hidePot, isAdmin }: RoundTable3DProps & { isAdmin?: boolean }) {
  // Optional PBR textures (loaded if available under /textures)
  const [feltTex, setFeltTex] = useState<THREE.Texture | null>(null);
  const [feltNorm, setFeltNorm] = useState<THREE.Texture | null>(null);
  const [woodTex, setWoodTex] = useState<THREE.Texture | null>(null);
  const [woodNorm, setWoodNorm] = useState<THREE.Texture | null>(null);
  const [linenNorm, setLinenNorm] = useState<THREE.Texture | null>(null);
  const [cardBackTex, setCardBackTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const tryLoad = (path: string, cb: (t: THREE.Texture | null) => void, repeat: boolean = false) => {
      loader.load(
        path,
        (tex) => {
          if (repeat) {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(1, 1);
          }
          cb(tex);
        },
        undefined,
        () => cb(null)
      );
    };
    // Attempt to load; failure will gracefully fallback to null
    tryLoad('/textures/felt_albedo.jpg', setFeltTex, true);
    tryLoad('/textures/felt_normal.jpg', setFeltNorm, true);
    tryLoad('/textures/wood_albedo.jpg', setWoodTex, true);
    tryLoad('/textures/wood_normal.jpg', setWoodNorm, true);
    tryLoad('/textures/card_linen_normal.jpg', setLinenNorm, true);
    tryLoad('/textures/card_back.png', setCardBackTex, false);
  }, []);

  return (
    <group>
      {/* Floor - Casino Room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#2a1810"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Subtle floor reflector for modern look */}
      <Reflector
        args={[12, 12]}
        resolution={256}
        mirror={0.3}
        mixBlur={0.2}
        mixStrength={0.3}
        depthScale={0.5}
        minDepthThreshold={0.8}
        maxDepthThreshold={1}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5.201, 0]}
      />

      {/* Carpet under table */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.15, 0]} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial 
          color="#4a2818"
          roughness={0.9}
        />
      </mesh>
      
      {/* Casino Table */}
      <CasinoTable3D feltTex={feltTex} feltNorm={feltNorm} woodTex={woodTex} woodNorm={woodNorm} />
      
      {/* Seats and Players */}
      {Array.from({ length: ((gameState as any).seats?.length || (gameState as any).maxPlayers || 3) }, (_, i) => i).map((seatIndex) => {
        const seatPositionIndex = seatIndex; // 0-based
        const totalSeats = ((gameState as any).seats?.length || (gameState as any).maxPlayers || 3);
        const seatPos = getPlayer3DPosition(seatPositionIndex, totalSeats);
        const seatRot = getPlayerRotation(seatPositionIndex, totalSeats);
        const occupant = (gameState.players || []).find((p) => (p.position || (seatIndex + 1)) === (seatIndex + 1));
        if (occupant) {
          const isCurrentPlayer = occupant.id === currentPlayerId;
          const hostId = (gameState as any)?.hostId;
          const admins = ((gameState as any)?.admins as string[] | undefined) ?? [];
          const firstPlayerId = gameState.players?.[0]?.id;
          const isHostResolved = hostId ? (hostId === occupant.id) : (firstPlayerId === occupant.id);
          const enriched = {
            ...occupant,
            isHost: isHostResolved,
            isAdmin: !isHostResolved && admins.includes(occupant.id)
          };
          return (
            <group key={occupant.id}>
              <Player3D
                player={enriched}
                position={seatPos}
                rotation={seatRot}
                isCurrentPlayer={isCurrentPlayer}
                isCurrentTurn={gameState.currentTurn === occupant.id}
              />
              {/* Admin-only Kick button before game starts (cannot kick host or self) */}
              {isAdmin && (gameState as any).status === 'waiting' && !isHostResolved && occupant.id !== currentPlayerId && (
                <Html position={[seatPos[0], seatPos[1] + 4.6, seatPos[2]]} center occlude distanceFactor={12} zIndexRange={[0,0]}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        (window as any).__onKickPlayer && (window as any).__onKickPlayer(occupant.id);
                      } catch {}
                    }}
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white border border-red-300 shadow hover:bg-red-700"
                    title="Remove player"
                  >
                    ✕
                  </button>
                </Html>
              )}
            </group>
          );
        }
        // Empty seat - show chair and join hint when waiting
        return (
          <group key={`empty-${seatIndex}`} position={seatPos} rotation={[0, seatRot, 0]}>
            <Chair3D isCurrentPlayer={false} />
            {gameState.status === 'waiting' && (
              <Html position={[0, 1.4, 0]} center distanceFactor={10} occlude zIndexRange={[0,0]}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      if ((window as any).__onSeatRequest) {
                        (window as any).__onSeatRequest(seatIndex + 1);
                        return;
                      }
                    } catch {}
                    const m = (typeof location !== 'undefined' && location.pathname.match(/\/game\/([^/?#]+)/));
                    const gameIdFromUrl = m && m[1];
                    if (gameIdFromUrl) {
                      const name = prompt('Enter your name to join this seat:', 'Guest');
                      if (name && name.trim()) {
                        const url = `/game/${encodeURIComponent(gameIdFromUrl)}?name=${encodeURIComponent(name.trim())}&seat=${seatIndex + 1}`;
                        window.location.href = url;
                      }
                    }
                  }}
                  className="px-2 py-1 text-xs font-semibold rounded-full border bg-white/90 dark:bg-gray-900/90 hover:bg-white shadow"
                  title="Join this seat"
                >
                  Join Seat {seatIndex + 1}
                </button>
              </Html>
            )}
          </group>
        );
      })}
      
      {/* Pot Display (hidden in spectator mode when hidePot=true) */}
      {!hidePot && <PotDisplay3D amount={gameState.pot} />}
      
      {/* Card Deck in Center - visible during game */}
      {gameState.status === 'playing' && (
        <CardDeck3D linenNorm={linenNorm} backTex={cardBackTex} />
      )}

      {/* Start button moved to bottom-right overlay */}
    </group>
  );
}

// Professional Casino Table Component with Visible Legs
function CasinoTable3D({ feltTex, feltNorm, woodTex, woodNorm }: { feltTex: THREE.Texture | null; feltNorm: THREE.Texture | null; woodTex: THREE.Texture | null; woodNorm: THREE.Texture | null; }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Table Top - Premium Felt Surface */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        {/* Felt inset slightly smaller than rim */}
        <cylinderGeometry args={[4.7, 4.7, 0.1, 64]} />
        {feltTex || feltNorm ? (
          <meshStandardMaterial
            map={feltTex ?? undefined}
            normalMap={feltNorm ?? undefined}
            roughness={0.9}
            metalness={0.04}
            color={feltTex ? undefined as any : "#14532d"}
          />
        ) : (
          <meshStandardMaterial color="#14532d" roughness={0.85} metalness={0.05} />
        )}
      </mesh>
      
      {/* Wooden Edge/Rim - Visible from below */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[5, 5, 0.2, 64]} />
        {woodTex || woodNorm ? (
          <meshStandardMaterial
            map={woodTex ?? undefined}
            normalMap={woodNorm ?? undefined}
            roughness={0.6}
            metalness={0.12}
            color={woodTex ? undefined as any : "#6b3f1f"}
          />
        ) : (
          <meshStandardMaterial color="#6b3f1f" roughness={0.55} metalness={0.15} />
        )}
      </mesh>
      
      
      {/* Table Legs - even slimmer and shorter */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <group key={`leg-${i}`} position={[Math.cos(angle) * 3.6, -2.0, Math.sin(angle) * 3.6]}>
          {/* Main leg column */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.07, 0.09, 3.6, 24]} />
            <meshStandardMaterial 
              color="#3a1f0a" 
              roughness={0.75}
              metalness={0.1}
            />
          </mesh>
          
          {/* Decorative rings on legs */}
          <mesh position={[0, 1.3, 0]}>
            <torusGeometry args={[0.11, 0.025, 12, 24]} />
            <meshStandardMaterial color="#5d3a1a" roughness={0.6} />
          </mesh>
          <mesh position={[0, -1.0, 0]}>
            <torusGeometry args={[0.13, 0.025, 12, 24]} />
            <meshStandardMaterial color="#5d3a1a" roughness={0.6} />
          </mesh>
          
          {/* Leg base/foot */}
          <mesh position={[0, -2.0, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 0.12, 24]} />
            <meshStandardMaterial 
              color="#2a1506" 
              roughness={0.7}
            />
          </mesh>
        </group>
      ))}
      
      {/* Cross braces between legs - lowered and slimmer */}
      {[0, Math.PI / 2].map((angle, i) => (
        <mesh 
          key={`brace-${i}`}
          position={[0, -2.3, 0]} 
          rotation={[0, angle, 0]}
          castShadow
        >
          <boxGeometry args={[7.0, 0.08, 0.10]} />
          <meshStandardMaterial 
            color="#3a1f0a" 
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// Player 3D Component
interface Player3DProps {
  player: any;
  position: [number, number, number];
  rotation: number;
  isCurrentPlayer: boolean;
  isCurrentTurn: boolean;
}

function Player3D({ player, position, rotation, isCurrentPlayer, isCurrentTurn }: Player3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const turnIndicatorRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const chestRef = useRef<THREE.Mesh>(null);
  
  // Animate turn indicator ring
  useFrame((state) => {
    if (turnIndicatorRef.current && isCurrentTurn && !player.hasFolded) {
      turnIndicatorRef.current.rotation.z = state.clock.elapsedTime * 2;
      turnIndicatorRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
    // Subtle head look and breathing
    if (headRef.current) {
      const t = state.clock.elapsedTime;
      // small nod toward table center
      headRef.current.rotation.x = -0.05 + Math.sin(t * 1.2) * 0.01;
    }
    if (chestRef.current) {
      const t = state.clock.elapsedTime;
      const s = 1 + Math.sin(t * 0.8) * 0.01;
      chestRef.current.scale.set(1, s, 1);
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Floor Turn Indicator - Rotating Ring at chair base level */}
      {isCurrentTurn && !player.hasFolded && (
        <>
          {/* Outer pulsing ring - at chair base, visible around player */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={turnIndicatorRef}>
            <ringGeometry args={[0.8, 1.0, 64]} />
            <meshBasicMaterial 
              color={isCurrentPlayer ? "#fbbf24" : "#22c55e"}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Inner glow circle - bright center */}
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.75, 64]} />
            <meshBasicMaterial 
              color={isCurrentPlayer ? "#fbbf24" : "#22c55e"}
              transparent
              opacity={0.5}
            />
          </mesh>
          
          {/* Arrows pointing inward to player - at base level */}
          {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
            <mesh 
              key={i}
              position={[
                Math.cos(angle) * 0.9,
                0.04,
                Math.sin(angle) * 0.9
              ]}
              rotation={[-Math.PI / 2, 0, angle + Math.PI]}
            >
              <coneGeometry args={[0.1, 0.2, 3]} />
              <meshBasicMaterial color={isCurrentPlayer ? "#fbbf24" : "#22c55e"} />
            </mesh>
          ))}
          
          {/* Additional outer glow ring for emphasis */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.0, 1.2, 64]} />
            <meshBasicMaterial 
              color={isCurrentPlayer ? "#fbbf24" : "#22c55e"}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
      
      {/* Professional Chair */}
      <Chair3D isCurrentPlayer={isCurrentPlayer} />
      
      {/* Realistic Human Avatar - Seated posture facing table */}
      <group position={[0, 0.55, 0]}>
        {/* Head - Smoother, more natural */}
        <mesh ref={headRef} position={[0, 1.7, 0.05]} rotation={[-0.05, 0, 0]} castShadow>
          <sphereGeometry args={[0.28, 64, 64]} />
          <meshStandardMaterial 
            color="#ffd4a3"
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
        
        {/* Hair - Natural style */}
        <mesh position={[0, 1.88, 0]} castShadow>
          <sphereGeometry args={[0.29, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#2c3e50" : "#5d4037"}
            roughness={1.0}
          />
        </mesh>
        
        {/* Eyes - Natural looking */}
        <mesh position={[-0.1, 1.75, 0.25]}>
          <sphereGeometry args={[0.035, 24, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0.1, 1.75, 0.25]}>
          <sphereGeometry args={[0.035, 24, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Eyebrows */}
        <mesh position={[-0.1, 1.80, 0.22]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.12, 0.02, 0.02]} />
          <meshStandardMaterial color="#2f2f2f" roughness={0.7} />
        </mesh>
        <mesh position={[0.1, 1.80, 0.22]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.12, 0.02, 0.02]} />
          <meshStandardMaterial color="#2f2f2f" roughness={0.7} />
        </mesh>
        
        {/* Nose - Subtle */}
        <mesh position={[0, 1.68, 0.27]} castShadow>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#ffc896" roughness={0.8} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.23, 1.72, 0.05]}>
          <sphereGeometry args={[0.06, 24, 24]} />
          <meshStandardMaterial color="#ffd4a3" roughness={0.85} />
        </mesh>
        <mesh position={[0.23, 1.72, 0.05]}>
          <sphereGeometry args={[0.06, 24, 24]} />
          <meshStandardMaterial color="#ffd4a3" roughness={0.85} />
        </mesh>
        
        {/* Mouth/Smile - Natural */}
        <mesh position={[0, 1.62, 0.26]}>
          <capsuleGeometry args={[0.01, 0.08, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d4867a" roughness={0.8} />
        </mesh>
        
        {/* Neck - Smooth */}
        <mesh position={[0, 1.45, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.2, 32]} />
          <meshStandardMaterial 
            color="#ffc896"
            roughness={0.8}
          />
        </mesh>
        
        {/* Upper Body/Torso - Rounded, natural */}
        <mesh ref={chestRef} position={[0, 1.03, 0]} rotation={[-0.05, 0, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.45, 16, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#3b82f6" : "#6b7280"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Shirt Collar */}
        <mesh position={[0, 1.4, 0.15]} castShadow>
          <boxGeometry args={[0.5, 0.06, 0.08]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#2563eb" : "#4b5563"}
            roughness={0.7}
          />
        </mesh>
        
        {/* Shoulders - Smooth rounded */}
        <mesh position={[-0.32, 1.25, 0]} castShadow>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#3b82f6" : "#6b7280"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[0.32, 1.25, 0]} castShadow>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#3b82f6" : "#6b7280"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Left Arm - Upper (smooth capsule) */}
        <mesh position={[-0.38, 1.05, 0.1]} rotation={[0.1, 0, 0.35]} castShadow>
          <capsuleGeometry args={[0.06, 0.35, 16, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#3b82f6" : "#6b7280"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Left Forearm - Natural */}
        <mesh position={[-0.48, 0.75, 0.5]} rotation={[-1.0, 0, 0.1]} castShadow>
          <capsuleGeometry args={[0.055, 0.32, 16, 32]} />
          <meshStandardMaterial color="#ffc896" roughness={0.8} />
        </mesh>
        
        {/* Left Hand - Natural palm */}
        {!player.hasFolded && (
          <mesh position={[-0.46, 0.28, 0.95]} rotation={[-0.1, 0, 0]} castShadow>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial color="#ffc896" roughness={0.9} />
          </mesh>
        )}
        
        {/* Right Arm - Upper (smooth capsule) */}
        <mesh position={[0.38, 1.05, 0.1]} rotation={[0.1, 0, -0.35]} castShadow>
          <capsuleGeometry args={[0.06, 0.35, 16, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#3b82f6" : "#6b7280"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Right Forearm - Natural */}
        <mesh position={[0.48, 0.75, 0.5]} rotation={[-1.0, 0, -0.1]} castShadow>
          <capsuleGeometry args={[0.055, 0.32, 16, 32]} />
          <meshStandardMaterial color="#ffc896" roughness={0.8} />
        </mesh>
        
        {/* Right Hand - Natural palm */}
        {!player.hasFolded && (
          <mesh position={[0.46, 0.28, 0.95]} rotation={[-0.1, 0, 0]} castShadow>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial color="#ffc896" roughness={0.9} />
          </mesh>
        )}
        {/* Simple fingers near right hand (pinch) */}
        {!player.hasFolded && (
          <>
            {[0,1,2,3].map((idx) => (
              <mesh key={`rf-${idx}`} position={[0.46 - idx*0.02, 0.28, 0.98 + idx*0.005]} rotation={[0.3, 0, 0.1]}>
                <cylinderGeometry args={[0.012, 0.012, 0.12, 12]} />
                <meshStandardMaterial color="#ffc896" roughness={0.9} />
              </mesh>
            ))}
            {/* Thumb */}
            <mesh position={[0.50, 0.30, 0.92]} rotation={[0.1, 0.3, -0.2]}>
              <cylinderGeometry args={[0.014, 0.014, 0.12, 12]} />
              <meshStandardMaterial color="#ffc896" roughness={0.9} />
            </mesh>
          </>
        )}
        
        {/* Lower Body/Hips */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.55, 0.3, 0.4]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#1e40af" : "#374151"}
            roughness={0.7}
          />
        </mesh>
        
        {/* Left Thigh - Smooth capsule */}
        <mesh position={[-0.16, 0.45, 0.25]} rotation={[0.0, 0, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.38, 16, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#1e40af" : "#374151"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Left Lower Leg - Natural */}
        <mesh position={[-0.16, 0.1, 0.05]} rotation={[0.0, 0, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.42, 16, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#1e40af" : "#374151"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Left Shoe - Rounded */}
        <mesh position={[-0.16, -0.1, 0.05]} castShadow>
          <capsuleGeometry args={[0.06, 0.12, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.2} />
        </mesh>
        
        {/* Right Thigh - Smooth capsule */}
        <mesh position={[0.16, 0.45, 0.25]} rotation={[0.0, 0, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.38, 16, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#1e40af" : "#374151"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Right Lower Leg - Natural */}
        <mesh position={[0.16, 0.1, 0.05]} rotation={[0.0, 0, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.42, 16, 32]} />
          <meshStandardMaterial 
            color={isCurrentPlayer ? "#1e40af" : "#374151"}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Right Shoe - Rounded */}
        <mesh position={[0.16, -0.1, 0.05]} castShadow>
          <capsuleGeometry args={[0.06, 0.12, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.2} />
        </mesh>
        
        {/* Turn Indicator Glow */}
        {isCurrentTurn && !player.hasFolded && (
          <>
            <mesh position={[0, 1.8, 0]}>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshBasicMaterial 
                color="#22c55e"
                transparent
                opacity={0.2}
              />
            </mesh>
            <pointLight position={[0, 1.8, 0]} intensity={1} color="#22c55e" distance={3} />
          </>
        )}
      </group>
      
      {/* Player Name Tag - Well Above Head */}
      <Html position={[0, 4.0, 0]} center occlude distanceFactor={12} zIndexRange={[0,0]}>
        <div className={[
          'px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-bold whitespace-nowrap shadow-xl transition-all',
          isCurrentPlayer 
            ? 'bg-blue-600 text-white border border-blue-300 sm:border-2' 
            : 'bg-gray-800 text-white border border-gray-600 sm:border-2',
          (isCurrentTurn && !player.hasFolded)
            ? 'bg-green-500 border-green-300 animate-pulse ring-2 sm:ring-4 ring-green-300/50' 
            : '',
          player.hasFolded ? 'opacity-50' : ''
        ].join(' ')}>
          {/* Presence dot */}
          <span
            className={[
              'absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-white',
              ((player as any).isOnline ?? player.isActive) ? 'bg-green-400' : 'bg-gray-400'
            ].join(' ')}
          />
          {/* Turn Indicator Badge - Top Center */}
          {isCurrentTurn && !player.hasFolded && (
            <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-full animate-bounce shadow-lg z-20">
              {isCurrentPlayer ? '🎯 YOUR TURN!' : '⏳ TURN'}
            </div>
          )}
          
          {/* Blind/Seen Status Badge - Top Left (No Overlap) */}
          {player.cards && player.cards.length > 0 && !player.hasFolded && (
            <div
              className={[
                'absolute -top-1 -left-2 text-[9px] sm:text-[10px] font-black px-1 py-0.5 sm:px-1.5 rounded-full shadow-lg border sm:border-2 z-10',
                player.hasSeen
                  ? 'bg-orange-500 text-white border-orange-300 animate-pulse'
                  : 'bg-blue-900 text-blue-100 border-blue-700'
              ].join(' ')}
            >
              {player.hasSeen ? '👁️ SEEN' : '🔒 BLIND'}
            </div>
          )}
          
          <div className="text-center leading-tight relative">
            <span>{player.name}</span>
            {((player as any)?.isHost) && (
              <span className="ml-2 text-[9px] px-1 py-0.5 rounded bg-yellow-300 text-black font-black align-middle">HOST</span>
            )}
            {!((player as any)?.isHost) && ((player as any)?.isAdmin) && (
              <span className="ml-2 text-[9px] px-1 py-0.5 rounded bg-blue-300 text-black font-black align-middle">ADMIN</span>
            )}
            {isCurrentTurn && !player.hasFolded && ' ⚡'}
          </div>
          <div className="text-[10px] sm:text-xs mt-1 text-center border-t border-white/20 pt-1 flex items-center justify-center gap-2">
            <span>💰 {player.chips} chips</span>
            {player.cards && player.cards.length > 0 && !player.hasFolded && (
              <span
                className={[
                  'text-[9px] sm:text-[10px] px-1 py-0.5 rounded',
                  player.hasSeen ? 'bg-orange-600/50' : 'bg-blue-600/50'
                ].join(' ')}
              >
                {player.hasSeen ? '👁️' : '🔒'}
              </span>
            )}
          </div>
        </div>
      </Html>
      
      {/* Cards - Animated from Table to Hands */}
      {player.cards && player.cards.length > 0 && !player.hasFolded && (
        <>
          {player.cards.map((card: any, i: number) => {
            // Table position (blind) - Flat on table surface
            // POSITIVE z = towards table center (like bet chips at z=1.2)
            const tablePos: [number, number, number] = [
              (i - 1) * 0.28,  // Spread cards horizontally  
              0.18,             // Just above table (table at y=0.15)
              2.0               // Towards center, on table (beyond bet chips)
            ];
            const tableRot: [number, number, number] = [
              -Math.PI / 2,     // Flat on table
              0, 
              (i - 1) * 0.08    // Slight fan
            ];
            
            // Hand position (seen) - Anchor to right hand for realistic hold
            const handAnchor: [number, number, number] = [0.44, 0.34, 0.92];
            const handPos: [number, number, number] = [
              handAnchor[0] + (i - 1) * 0.12,
              handAnchor[1] + i * 0.005,
              handAnchor[2] + (i - 1) * 0.01
            ];
            const handRot: [number, number, number] = [
              -Math.PI / 7,     // ~25 degrees tilt
              0,
              (i - 1) * 0.18
            ];
            
            // Stagger dealing animation - each card dealt one after another
            // Player position affects dealing order, card index adds delay within player's cards
            const dealDelay = (player.position - 1) * 0.5 + i * 0.3;
            
            return (
              <group key={i}>
                <Card3D 
                  position={player.hasSeen ? handPos : tablePos}
                  rotation={player.hasSeen ? handRot : tableRot}
                  card={card}
                  hasSeen={player.hasSeen}
                  tablePosition={tablePos}
                  handPosition={handPos}
                  tableRotation={tableRot}
                  handRotation={handRot}
                  dealDelay={dealDelay}
                  linenNorm={/* from GameScene3D scope */ undefined}
                  backTex={/* from GameScene3D scope */ undefined}
                />
                {/* Glow effect for seen cards */}
                {player.hasSeen && (
                  <pointLight 
                    position={[handPos[0], handPos[1], handPos[2] + 0.2]} 
                    intensity={0.5} 
                    color="#ff8800" 
                    distance={0.8} 
                  />
                )}
              </group>
            );
          })}
          
          {/* Visual indicator showing cards are SEEN */}
          {player.hasSeen && (
            <mesh position={[0, 1.0, 0.6]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial 
                color="#ff8800"
                transparent
                opacity={0.2}
              />
            </mesh>
          )}
        </>
      )}
      
      {/* Bet Chips on Table - removed */}
    </group>
  );
}

// Professional Gaming Chair Component
function Chair3D({ isCurrentPlayer }: { isCurrentPlayer: boolean }) {
  const seatColor = isCurrentPlayer ? "#1e40af" : "#78350f";
  const frameColor = "#1a1a1a";
  
  return (
    <group position={[0, 0, 0]}>
      {/* Padded Seat */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.12, 0.75]} />
        <meshStandardMaterial 
          color={seatColor} 
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      
      {/* Seat cushion details */}
      <mesh position={[0, 0.67, 0]}>
        <boxGeometry args={[0.7, 0.05, 0.65]} />
        <meshStandardMaterial 
          color={isCurrentPlayer ? "#2563eb" : "#92400e"}
          roughness={0.4}
        />
      </mesh>
      
      {/* Back Rest - Curved */}
      <mesh position={[0, 1.1, -0.32]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 1, 0.12]} />
        <meshStandardMaterial 
          color={seatColor}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      
      {/* Back cushion padding */}
      <mesh position={[0, 1.1, -0.26]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.7, 0.85, 0.06]} />
        <meshStandardMaterial 
          color={isCurrentPlayer ? "#2563eb" : "#92400e"}
          roughness={0.4}
        />
      </mesh>
      
      {/* Armrests */}
      <mesh position={[-0.45, 0.85, 0]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.6]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0.45, 0.85, 0]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.6]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.3} />
      </mesh>
      
      {/* Chair Frame/Legs */}
      {[
        [-0.35, 0.3, -0.35],
        [0.35, 0.3, -0.35],
        [-0.35, 0.3, 0.35],
        [0.35, 0.3, 0.35]
      ].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.6, 16]} />
          <meshStandardMaterial 
            color={frameColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
      ))}
      
      {/* Chair base */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.1, 24]} />
        <meshStandardMaterial 
          color={frameColor}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

// Card 3D Component with Smooth Animation
interface Card3DProps {
  position: [number, number, number];
  rotation: [number, number, number];
  card: any;
  hasSeen: boolean;
  tablePosition: [number, number, number];
  handPosition: [number, number, number];
  tableRotation: [number, number, number];
  handRotation: [number, number, number];
  dealDelay?: number;
  linenNorm?: THREE.Texture | null;
  backTex?: THREE.Texture | null;
}

function Card3D({ position, rotation, card, hasSeen, tablePosition, handPosition, tableRotation, handRotation, dealDelay = 0, linenNorm, backTex }: Card3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const prevHasSeenRef = useRef(hasSeen);
  const [isDealing, setIsDealing] = useState(true);
  const dealingProgressRef = useRef(0);
  const delayTimerRef = useRef(0);
  const jitterPhaseRef = useRef(Math.random() * Math.PI * 2);
  
  // Deck position (center of table) - starting point for dealing animation
  const deckPosition: [number, number, number] = [0, 0.6, 0];
  
  // Animate position and rotation
  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;
    
    // Handle initial delay before dealing starts
    if (isDealing && delayTimerRef.current < dealDelay) {
      delayTimerRef.current += delta;
      // Keep card hidden at deck position during delay
      groupRef.current.position.set(deckPosition[0], deckPosition[1], deckPosition[2]);
      groupRef.current.scale.set(0.001, 0.001, 0.001); // Make invisible
      return;
    }
    
    // Initial dealing animation from deck to table position
    if (isDealing && dealingProgressRef.current < 1) {
      // Make card visible
      groupRef.current.scale.set(1, 1, 1);
      
      dealingProgressRef.current += 0.06; // Dealing speed - slightly faster
      
      if (dealingProgressRef.current >= 1) {
        dealingProgressRef.current = 1;
        setIsDealing(false);
      }
      
      const t = dealingProgressRef.current;
      // Smooth easing with subtle overshoot (easeOutBack)
      const s = 1.70158;
      const eased = 1 + ( (t-1) * (t-1) * ( (s+1) * (t-1) + s) );
      
      // Interpolate from deck position to table position
      groupRef.current.position.x = deckPosition[0] + (tablePosition[0] - deckPosition[0]) * eased;
      groupRef.current.position.y = deckPosition[1] + (tablePosition[1] - deckPosition[1]) * eased + Math.sin(t * Math.PI) * 0.8; // Higher arc
      groupRef.current.position.z = deckPosition[2] + (tablePosition[2] - deckPosition[2]) * eased;
      
      // Rotate while dealing - more dramatic
      meshRef.current.rotation.x = -Math.PI / 2 + t * (tableRotation[0] + Math.PI / 2);
      meshRef.current.rotation.y = tableRotation[1] + Math.sin(t * Math.PI * 4) * 0.5;
      meshRef.current.rotation.z = tableRotation[2] + t * Math.PI * 3; // More spins
      return;
    }
    
    // If blind (not seen), gently settle to table position
    if (!hasSeen) {
      groupRef.current.position.x += (tablePosition[0] - groupRef.current.position.x) * 0.25;
      groupRef.current.position.y += (tablePosition[1] - groupRef.current.position.y) * 0.25;
      groupRef.current.position.z += (tablePosition[2] - groupRef.current.position.z) * 0.25;
      meshRef.current.rotation.x += (tableRotation[0] - meshRef.current.rotation.x) * 0.25;
      meshRef.current.rotation.y += (tableRotation[1] - meshRef.current.rotation.y) * 0.25;
      meshRef.current.rotation.z += (tableRotation[2] - meshRef.current.rotation.z) * 0.25;
      return;
    }
    
    // If seen, smoothly animate to hand position
    if (hasSeen) {
      groupRef.current.position.x += (handPosition[0] - groupRef.current.position.x) * 0.15;
      groupRef.current.position.y += (handPosition[1] - groupRef.current.position.y) * 0.15;
      groupRef.current.position.z += (handPosition[2] - groupRef.current.position.z) * 0.15;
      
      meshRef.current.rotation.x += (handRotation[0] - meshRef.current.rotation.x) * 0.15;
      meshRef.current.rotation.y += (handRotation[1] - meshRef.current.rotation.y) * 0.15;
      meshRef.current.rotation.z += (handRotation[2] - meshRef.current.rotation.z) * 0.15;

      // Subtle hand jitter for realism
      if (!document.documentElement.classList.contains('reduce-motion')) {
        jitterPhaseRef.current += delta * 2;
        meshRef.current.rotation.z += Math.sin(jitterPhaseRef.current) * 0.0025;
      }
    }
  });
  
  // Initialize position at deck (center of table)
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(deckPosition[0], deckPosition[1], deckPosition[2]);
    }
    if (meshRef.current) {
      meshRef.current.rotation.set(-Math.PI / 2, 0, 0);
    }
  }, []);
  
  return (
    <group ref={groupRef} renderOrder={200}>
      {/* Card body with rounded corners effect */}
      <RoundedBox
        ref={meshRef as any}
        args={[0.28, 0.38, 0.012]}
        radius={0.012}
        smoothness={4}
        castShadow
        receiveShadow
      >
        {hasSeen ? (
          <meshPhysicalMaterial
            color={"#ffffff"}
            roughness={0.35}
            metalness={0.03}
            clearcoat={0.15}
            clearcoatRoughness={0.7}
            normalMap={linenNorm ?? undefined}
            normalScale={linenNorm ? new THREE.Vector2(0.25, 0.25) : undefined}
          />
        ) : (
          <meshPhysicalMaterial
            color={"#1e3a8a"}
            roughness={0.28}
            metalness={0.05}
          />
        )}
      </RoundedBox>
      
      {/* Card back - Blue pattern when not seen */}
      {!hasSeen && !backTex && (
        <>
          {/* Main back design */}
          <mesh position={[0, 0, 0.006]}>
            <planeGeometry args={[0.26, 0.36]} />
            <meshStandardMaterial 
              color="#2563eb" 
              roughness={0.3}
              metalness={0.2}
            />
          </mesh>
          {/* Inner rectangle */}
          <mesh position={[0, 0, 0.007]}>
            <planeGeometry args={[0.22, 0.32]} />
            <meshStandardMaterial 
              color="#1e40af"
              roughness={0.4}
            />
          </mesh>
          {/* Center circle pattern */}
          <mesh position={[0, 0, 0.008]}>
            <circleGeometry args={[0.08, 32]} />
            <meshStandardMaterial 
              color="#3b82f6"
              roughness={0.3}
            />
          </mesh>
          {/* Small decorative circles */}
          {[[-0.06, 0.08], [0.06, 0.08], [-0.06, -0.08], [0.06, -0.08]].map((pos, i) => (
            <mesh key={i} position={[pos[0], pos[1], 0.0075]}>
              <circleGeometry args={[0.02, 16]} />
              <meshStandardMaterial color="#60a5fa" roughness={0.3} />
            </mesh>
          ))}
        </>
      )}

      {/* Card back (texture) when blind */}
      {!hasSeen && backTex && (
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.26, 0.36]} />
          <meshStandardMaterial map={backTex} roughness={0.35} metalness={0.05} />
        </mesh>
      )}
      
      {/* Card front - Show when seen */}
      {hasSeen && (
        <>
          {/* Card white face */}
          <mesh position={[0, 0, 0.006]}>
            <planeGeometry args={[0.26, 0.36]} />
            <meshStandardMaterial 
              color="#ffffff"
              roughness={0.2}
              metalness={0.05}
            />
          </mesh>
          {/* Subtle border */}
          <mesh position={[0, 0, 0.007]}>
            <planeGeometry args={[0.24, 0.34]} />
            <meshStandardMaterial 
              color="#f9fafb"
              roughness={0.3}
            />
          </mesh>
          {/* Inner playing area */}
          <mesh position={[0, 0, 0.008]}>
            <planeGeometry args={[0.22, 0.32]} />
            <meshStandardMaterial 
              color="#ffffff"
              roughness={0.2}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// Chip Stack Component
function ChipStack3D({ amount }: { amount: number }) {
  const numChips = Math.min(Math.floor(amount / 10), 20);
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"];
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < numChips; i++) {
      dummy.position.set((Math.random() - 0.5) * 0.02, i * 0.031, (Math.random() - 0.5) * 0.02);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      const color = new THREE.Color(colors[i % colors.length]);
      // @ts-ignore
      meshRef.current.setColorAt?.(i, color);
    }
    meshRef.current.count = numChips;
    meshRef.current.instanceMatrix.needsUpdate = true;
    // @ts-ignore
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [numChips, amount]);
  
  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, Math.max(1, numChips)]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.03, 48]} />
        <meshStandardMaterial roughness={0.35} metalness={0.4} />
      </instancedMesh>
      
      {/* Amount label */}
      <Html position={[0, numChips * 0.031 + 0.22, 0]} center occlude distanceFactor={12}>
        <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">
          {amount.toLocaleString?.() ?? amount}
        </div>
      </Html>
    </group>
  );
}

// Card Deck Component - Shows remaining deck in center of table
function CardDeck3D({ linenNorm, backTex }: { linenNorm: THREE.Texture | null; backTex: THREE.Texture | null; }) {
  return (
    <group position={[0, 0.18, 0]}>
      {/* Stack of remaining cards - realistic pile */}
      {Array.from({ length: 20 }).map((_, i) => (
        <group key={i} position={[
          (Math.random() - 0.5) * 0.02,
          i * 0.01,
          (Math.random() - 0.5) * 0.02
        ]} rotation={[-Math.PI / 2, 0, i * 0.025 + (Math.random() - 0.5) * 0.15]}>
          <RoundedBox args={[0.28, 0.38, 0.012]} radius={0.012} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#1e3a8a" roughness={0.25} metalness={0.04} />
          </RoundedBox>
        </group>
      ))}
      {/* Subtle top card wobble */}
      <TopDeckCard3D linenNorm={linenNorm} backTex={backTex} />
      {/* Top card back design - visible card */}
      <mesh position={[0, 0.21, 0.006]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.26, 0.36]} />
        <meshStandardMaterial 
          color="#2563eb"
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.22, 0.006]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, 0.32]} />
        <meshStandardMaterial 
          color="#1e40af"
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.23, 0.006]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 32]} />
        <meshStandardMaterial 
          color="#3b82f6"
          roughness={0.3}
        />
      </mesh>
      {/* Corner decorative circles on top card */}
      {[[-0.06, 0.08], [0.06, 0.08], [-0.06, -0.08], [0.06, -0.08]].map((pos, i) => (
        <mesh key={`corner-${i}`} position={[pos[0], 0.225, pos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.02, 16]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.3} />
        </mesh>
      ))}
      
      {/* Deck label */}
      <Html position={[0, 0.3, 0]} center occlude distanceFactor={12} zIndexRange={[0,0]}>
        <div className="bg-blue-900/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold shadow-lg border border-blue-400/30">
          🎴 Deck
        </div>
      </Html>
    </group>
  );
}

function TopDeckCard3D({ linenNorm, backTex }: { linenNorm: THREE.Texture | null; backTex: THREE.Texture | null; }) {
  const groupRef = useRef<THREE.Group>(null);
  const tRef = useRef(0);
  useFrame((_, delta) => {
    tRef.current += delta;
    if (!groupRef.current) return;
    const reduceMotion = document.documentElement.classList.contains('reduce-motion');
    const y = 0.22 + (reduceMotion ? 0 : Math.sin(tRef.current * 1.2) * 0.005);
    const rot = reduceMotion ? 0 : Math.sin(tRef.current * 1.6) * 0.03;
    groupRef.current.position.set(0, y, 0);
    groupRef.current.rotation.set(-Math.PI / 2, 0, rot);
  });
  return (
    <group ref={groupRef}>
      <RoundedBox args={[0.28, 0.38, 0.012]} radius={0.012} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#2563eb" roughness={0.3} metalness={0.06} normalMap={linenNorm ?? undefined} />
      </RoundedBox>
      {backTex && (
        <mesh position={[0, 0, 0.007]}>
          <planeGeometry args={[0.26, 0.36]} />
          <meshStandardMaterial map={backTex} roughness={0.35} metalness={0.05} />
        </mesh>
      )}
    </group>
  );
}

// Pot Display Component
function PotDisplay3D({ amount }: { amount: number }) {
  const prevRef = useRef(amount);
  const [pulse, setPulse] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    if (amount > prev) {
      setPulse(true);
      setDelta(amount - prev);
      const t1 = setTimeout(() => setPulse(false), 500);
      const t2 = setTimeout(() => setDelta(null), 1000);
      prevRef.current = amount;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    prevRef.current = amount;
  }, [amount]);
  return (
    <group position={[0, 0.5, -0.8]}>
      {/* Pot Container */}
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.3, 32]} />
        <meshPhysicalMaterial 
          color="#ffd700"
          metalness={0.85}
          roughness={0.15}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          reflectivity={0.9}
        />
      </mesh>
      
      {/* Shine effect */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshBasicMaterial 
          color="#ffea00"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Amount Display */}
      <Html position={[0, 0.65, 0]} center occlude distanceFactor={12} zIndexRange={[0,0]}>
        <div className={`bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-lg shadow-2xl border border-yellow-300 sm:border-2 ${pulse ? 'ring-2 ring-white/70 animate-pulse' : ''}`}>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <div>
              <p className="text-[9px] sm:text-xs font-bold opacity-90 leading-none">POT</p>
              <p className="text-base sm:text-xl font-black leading-tight">{amount.toLocaleString?.() ?? amount}</p>
            </div>
            <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
      </Html>
      {delta !== null && delta > 0 && (
        <Html position={[0, 1.1, 0]} center occlude distanceFactor={12} zIndexRange={[0,0]}>
          <div className="text-xs sm:text-sm font-black text-yellow-600 bg-white/80 dark:bg-black/40 backdrop-blur px-2 py-0.5 rounded-full shadow animate-bounce">
            +{delta}
          </div>
        </Html>
      )}
    </group>
  );
}

// Helper Functions
function getPlayer3DPosition(index: number, total: number): [number, number, number] {
  const baseRadius = 6;
  // Expand radius more as seats increase to fit up to 10 without overlap
  const extra = total > 6 ? Math.min(3, (total - 6) * 0.5) : 0;
  const radius = baseRadius + extra;
  // Distribute evenly around circle; offset so first seat is near front
  const angle = (2 * Math.PI * index) / total + Math.PI / 2;
  return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius];
}

function getPlayerRotation(index: number, total: number): number {
  // Compute position and rotate to face the table center (0,0,0)
  const pos = getPlayer3DPosition(index, total);
  // Rotation around Y to look at origin: atan2(x, z) + PI
  const rotY = Math.atan2(pos[0], pos[2]) + Math.PI;
  return rotY;
}

