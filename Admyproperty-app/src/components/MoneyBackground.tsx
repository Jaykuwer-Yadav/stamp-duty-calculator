import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Easing, DimensionValue } from 'react-native';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MoneyParticleProps {
  index: number;
  symbols: string[];
  primaryColor: string;
}

function MoneyParticle({ index, symbols, primaryColor }: MoneyParticleProps) {
  const fallAnim = useRef(new Animated.Value(-100)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;

  // Select a symbol from the active theme's symbols
  const symbol = symbols[index % symbols.length];

  // Randomize initial properties
  const leftPos = useRef<DimensionValue>(((Math.random() * 95) + '%') as DimensionValue).current;
  const size = useRef(Math.random() * 18 + 14).current; // size between 14px and 32px
  const opacity = useRef(Math.random() * 0.15 + 0.12).current; // slightly more visible for game themes

  const startAnimation = () => {
    // Reset values
    fallAnim.setValue(-80);
    rotateAnim.setValue(0);
    swayAnim.setValue(0);

    const duration = Math.random() * 5000 + 3500; // 3.5s to 8.5s fall duration
    const delay = Math.random() * 5000; // random spawn delay up to 5s

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: SCREEN_HEIGHT + 100,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: Math.random() * 2 + 1, // spins 360 to 720 degrees
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          // Horizontal swaying movement
          Animated.timing(swayAnim, {
            toValue: Math.random() * 60 - 30,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: Math.random() * 60 - 30,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: Math.random() * 60 - 30,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: 0,
            duration: duration / 4,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start((result) => {
      // Loop forever
      if (result.finished) {
        startAnimation();
      }
    });
  };

  useEffect(() => {
    startAnimation();
    return () => {
      fallAnim.stopAnimation();
      rotateAnim.stopAnimation();
      swayAnim.stopAnimation();
    };
  }, [symbols]); // Restart if symbols change

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          left: leftPos,
          fontSize: size,
          opacity: opacity,
          transform: [
            { translateY: fallAnim },
            { translateX: swayAnim },
            { rotate: spin },
          ],
        },
      ]}
    >
      {symbol}
    </Animated.Text>
  );
}

interface MoneyBackgroundProps {
  symbols: string[];
  primaryColor: string;
  activeThemeKey: string;
}

export default function MoneyBackground({ symbols, primaryColor, activeThemeKey }: MoneyBackgroundProps) {
  // Generate particles
  const particleCount = 18;
  const particles = Array.from({ length: particleCount });

  // Neon ball physics simulator animations
  const ballX = useRef(new Animated.Value(SCREEN_WIDTH * 0.3)).current;
  const ballY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.4)).current;

  useEffect(() => {
    if (activeThemeKey !== 'brick_breaker') return;

    const runBallAnimation = () => {
      Animated.loop(
        Animated.sequence([
          // 1. Move to top-right brick grid
          Animated.parallel([
            Animated.timing(ballX, {
              toValue: SCREEN_WIDTH * 0.75,
              duration: 1800,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            Animated.timing(ballY, {
              toValue: SCREEN_HEIGHT * 0.12,
              duration: 1800,
              useNativeDriver: true,
              easing: Easing.linear,
            })
          ]),
          // 2. Bounce off top and head middle-left
          Animated.parallel([
            Animated.timing(ballX, {
              toValue: SCREEN_WIDTH * 0.2,
              duration: 1400,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            Animated.timing(ballY, {
              toValue: SCREEN_HEIGHT * 0.45,
              duration: 1400,
              useNativeDriver: true,
              easing: Easing.linear,
            })
          ]),
          // 3. Bounce off left wall and head down to center paddle
          Animated.parallel([
            Animated.timing(ballX, {
              toValue: SCREEN_WIDTH * 0.5,
              duration: 1300,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            Animated.timing(ballY, {
              toValue: SCREEN_HEIGHT - 60, // hit paddle Y
              duration: 1300,
              useNativeDriver: true,
              easing: Easing.linear,
            })
          ]),
          // 4. Bounce off paddle and head to top-left bricks
          Animated.parallel([
            Animated.timing(ballX, {
              toValue: SCREEN_WIDTH * 0.1,
              duration: 1500,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            Animated.timing(ballY, {
              toValue: SCREEN_HEIGHT * 0.15,
              duration: 1500,
              useNativeDriver: true,
              easing: Easing.linear,
            })
          ]),
          // 5. Bounce off top and head to right wall
          Animated.parallel([
            Animated.timing(ballX, {
              toValue: SCREEN_WIDTH * 0.9,
              duration: 1200,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            Animated.timing(ballY, {
              toValue: SCREEN_HEIGHT * 0.5,
              duration: 1200,
              useNativeDriver: true,
              easing: Easing.linear,
            })
          ]),
          // 6. Bounce off right wall down to right-side paddle
          Animated.parallel([
            Animated.timing(ballX, {
              toValue: SCREEN_WIDTH * 0.7,
              duration: 1000,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            Animated.timing(ballY, {
              toValue: SCREEN_HEIGHT - 60, // hit paddle Y
              duration: 1000,
              useNativeDriver: true,
              easing: Easing.linear,
            })
          ]),
        ])
      ).start();
    };

    runBallAnimation();

    return () => {
      ballX.stopAnimation();
      ballY.stopAnimation();
    };
  }, [activeThemeKey]);

  // Bind paddle X translation to follow ball X
  // Paddle is 90px wide, ball is 12px wide. 
  // Map ball position to center the paddle under the ball.
  const paddleTranslateX = ballX.interpolate({
    inputRange: [0, SCREEN_WIDTH],
    outputRange: [-45, SCREEN_WIDTH - 45],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Minecraft Theme Clouds & Grass Block Borders */}
      {activeThemeKey === 'minecraft_anime' && (
        <>
          {/* Minecraft Pixelated Clouds at top */}
          <View style={[styles.mcCloud, { top: '8%', left: '10%', width: 140, height: 40 }]} />
          <View style={[styles.mcCloud, { top: '15%', right: '8%', width: 100, height: 32 }]} />
          <View style={[styles.mcCloud, { top: '22%', left: '45%', width: 80, height: 28 }]} />

          {/* Minecraft Grass Dirt blocks at the bottom of the viewport */}
          <View style={styles.mcGrassFloorContainer}>
            <View style={styles.mcGrassBorder} />
            <View style={styles.mcDirtBlock} />
          </View>
        </>
      )}

      {/* Brick Breaker Neon Arcade Bricks and Paddle */}
      {activeThemeKey === 'brick_breaker' && (
        <>
          {/* Arcade Bricks grid at the top */}
          <View style={styles.arcadeBricksGrid}>
            <View style={[styles.arcadeBrick, { borderColor: '#ff003c', shadowColor: '#ff003c' }]} />
            <View style={[styles.arcadeBrick, { borderColor: '#ffaa00', shadowColor: '#ffaa00' }]} />
            <View style={[styles.arcadeBrick, { borderColor: '#39ff14', shadowColor: '#39ff14' }]} />
            <View style={[styles.arcadeBrick, { borderColor: '#00ffff', shadowColor: '#00ffff' }]} />
            <View style={[styles.arcadeBrick, { borderColor: '#bd00ff', shadowColor: '#bd00ff' }]} />
          </View>

          {/* Animated Neon Arcade Ball */}
          <Animated.View 
            style={[
              styles.arcadeBall,
              {
                transform: [
                  { translateX: ballX },
                  { translateY: ballY }
                ]
              }
            ]}
          />

          {/* Animated Arcade Paddle at the bottom following the ball */}
          <Animated.View 
            style={[
              styles.arcadePaddle,
              {
                transform: [
                  { translateX: paddleTranslateX }
                ]
              }
            ]}
          />
        </>
      )}

      {/* Falling money particles */}
      {particles.map((_, i) => (
        <MoneyParticle 
          key={i} 
          index={i} 
          symbols={symbols} 
          primaryColor={primaryColor} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    top: 0,
    zIndex: 0,
    userSelect: 'none',
  },
  // Minecraft Cloud
  mcCloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 0, // Blocky clouds!
    borderWidth: 2,
    borderColor: '#ffffff',
    borderBottomWidth: 5,
    borderBottomColor: '#e0e0e0',
  },
  // Minecraft grass footer
  mcGrassFloorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 1,
  },
  mcGrassBorder: {
    height: 8,
    backgroundColor: '#5cbf3a',
    borderTopWidth: 2,
    borderTopColor: '#000000',
    borderBottomWidth: 2,
    borderBottomColor: '#47a228',
  },
  mcDirtBlock: {
    flex: 1,
    backgroundColor: '#866043',
  },
  // Brick Breaker arcade styling
  arcadeBricksGrid: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    right: '5%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 6,
  },
  arcadeBrick: {
    width: 60,
    height: 16,
    borderWidth: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  arcadeBall: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderColor: '#00ffff',
    borderWidth: 1,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    zIndex: 2,
  },
  arcadePaddle: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    width: 90,
    height: 10,
    backgroundColor: '#00ffff',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    zIndex: 2,
  },
});
