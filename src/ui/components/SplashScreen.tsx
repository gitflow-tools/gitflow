import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

interface SplashScreenProps {
  onComplete: () => void;
  termWidth: number;
  termHeight: number;
}

type SplashPhase = 'logo' | 'init' | 'detect' | 'ready';

const BRANCH_ART = [
  { text: '        ●', color: '#FF6B35' },
  { text: '        │', color: '#6B7280' },
  { text: '    ●───┤', color: '#FF4444' },
  { text: '    │   ╰──●', color: '#6B7280' },
  { text: '    │', color: '#6B7280' },
  { text: '    ●', color: '#FF6B9D' },
];

const PHASE_MESSAGES: Record<SplashPhase, string> = {
  logo: '',
  init: 'initialising',
  detect: 'detecting repository',
  ready: 'ready',
};

export function SplashScreen({ onComplete, termWidth, termHeight }: SplashScreenProps): React.ReactElement {
  const [phase, setPhase] = useState<SplashPhase>('logo');
  const [visibleLines, setVisibleLines] = useState(0);
  const [dotFrame, setDotFrame] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    BRANCH_ART.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 80 + i * 70));
    });

    const logoDone = 80 + BRANCH_ART.length * 70 + 100;
    timers.push(setTimeout(() => setPhase('init'), logoDone));
    timers.push(setTimeout(() => setPhase('detect'), logoDone + 300));
    timers.push(setTimeout(() => setPhase('ready'), logoDone + 550));
    timers.push(setTimeout(() => onComplete(), logoDone + 750));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotFrame(prev => (prev + 1) % 4);
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const dots = '.'.repeat(dotFrame);
  const message = PHASE_MESSAGES[phase];
  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const spinner =
    phase !== 'logo' && phase !== 'ready' ? spinnerChars[dotFrame % spinnerChars.length] + ' ' : '';
  const statusIcon = phase === 'ready' ? '✓ ' : '';

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width={termWidth}
      height={termHeight}
    >
      <Box flexDirection="column" alignItems="center">
        {BRANCH_ART.slice(0, visibleLines).map((line, i) => (
          <Text key={i} color={line.color}>
            {line.text}
          </Text>
        ))}

        {visibleLines >= BRANCH_ART.length && (
          <Box flexDirection="column" alignItems="center" marginTop={1}>
            <Text>
              <Text color="#FF6B35" bold>
                git
              </Text>
              <Text color="#FF6B9D" bold>
                flow
              </Text>
            </Text>
            <Text color="#6B7280" italic>
              {' '}
              WORK. COMMIT. FLOW.
            </Text>
          </Box>
        )}

        {visibleLines >= BRANCH_ART.length && message !== '' && (
          <Box marginTop={1} flexDirection="row">
            <Text color={phase === 'ready' ? '#4ADE80' : '#6B7280'}>
              {statusIcon}
              {spinner}
              {message}
              {phase !== 'ready' ? dots : ''}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
