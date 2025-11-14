'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Eye,
  Users,
  Share2,
  Copy,
  ExternalLink,
  Crown,
  Shield,
  Lock,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { APP_TITLE } from '@/lib/appConfig';
import { toast } from 'sonner';

interface SpectatorModeProps {
  gameId: string;
  isHost: boolean;
  isPrivate: boolean;
  spectatorCount: number;
  onTogglePrivacy: () => void;
}

export function SpectatorMode({
  gameId,
  isHost,
  isPrivate,
  spectatorCount,
  onTogglePrivacy
}: SpectatorModeProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [spectatorLink, setSpectatorLink] = useState('');

  const generateSpectatorLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/game/${gameId}/spectate`;
    setSpectatorLink(link);
    return link;
  };

  const copySpectatorLink = async () => {
    const link = generateSpectatorLink();
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Spectator link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareSpectatorLink = () => {
    const link = generateSpectatorLink();
    if (navigator.share) {
      navigator.share({
        title: `Watch ${APP_TITLE}`,
        text: `Join me to watch this exciting Teen Patti game!`,
        url: link,
      });
    } else {
      copySpectatorLink();
    }
  };

  return (
    <>
      {/* Spectator Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Spectator Mode
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {spectatorCount} watching • {isPrivate ? 'Private' : 'Public'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <Button
              onClick={onTogglePrivacy}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              {isPrivate ? 'Make Public' : 'Make Private'}
            </Button>
          )}

          <Button
            onClick={() => setShowShareModal(true)}
            size="sm"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Share2 className="h-4 w-4" />
            Share Game
          </Button>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
            >
              <div className="text-center mb-6">
                <Share2 className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Share Game with Spectators
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Let others watch your game in real-time!
                </p>
              </div>

              <div className="space-y-4">
                {/* Privacy Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    {isPrivate ? (
                      <Lock className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Globe className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm font-medium">
                      Game is {isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <Badge variant={isPrivate ? "secondary" : "default"}>
                    {isPrivate ? 'Invite Only' : 'Anyone Can Watch'}
                  </Badge>
                </div>

                {/* Spectator Link */}
                <div className="space-y-2">
                  <Label htmlFor="spectator-link" className="text-sm font-medium">
                    Spectator Link
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="spectator-link"
                      value={spectatorLink || generateSpectatorLink()}
                      readOnly
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={copySpectatorLink}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={shareSpectatorLink}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Link
                  </Button>
                  <Button
                    onClick={() => window.open(generateSpectatorLink(), '_blank')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Link
                  </Button>
                </div>

                {/* Host Controls */}
                {isHost && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Host Controls
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={onTogglePrivacy}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {isPrivate ? '🔓 Make Public' : '🔒 Make Private'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled
                        >
                          🚫 Kick Spectator
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => setShowShareModal(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Spectator Badge Component
export function SpectatorBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium"
    >
      <Eye className="h-3 w-3" />
      <span>{count}</span>
    </motion.div>
  );
}

// Spectator List Component
export function SpectatorList({ spectators }: { spectators: Array<{ id: string; name: string; joinedAt: Date }> }) {
  if (spectators.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4" />
          Spectators ({spectators.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {spectators.map((spectator) => (
            <div
              key={spectator.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">{spectator.name}</span>
              </div>
              <span className="text-xs text-gray-500">
                {Math.floor((Date.now() - spectator.joinedAt.getTime()) / 1000 / 60)}m ago
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
