'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Check, DollarSign, TrendingUp, TrendingDown, Users, Calculator } from 'lucide-react';

interface PlayerSettlement {
  name: string;
  finalChips: number;
  initialChips: number;
  netChips: number; // profit or loss
}

interface MoneyTransaction {
  from: string;
  to: string;
  chips: number;
  amount: number;
}

interface SettlementViewProps {
  players: PlayerSettlement[];
  defaultChipValue?: number;
}

export function SettlementView({ players, defaultChipValue = 1 }: SettlementViewProps) {
  const [chipValue, setChipValue] = useState(defaultChipValue.toString());
  const [paidTransactions, setPaidTransactions] = useState<Set<string>>(new Set());

  const chipValueNum = parseFloat(chipValue) || 1;

  // Calculate settlements using simplified algorithm
  const calculateSettlements = (): MoneyTransaction[] => {
    const transactions: MoneyTransaction[] = [];
    
    // Separate winners and losers
    const winners = players.filter(p => p.netChips > 0).sort((a, b) => b.netChips - a.netChips);
    const losers = players.filter(p => p.netChips < 0).sort((a, b) => a.netChips - b.netChips);

    let winnerIdx = 0;
    let loserIdx = 0;
    let winnerRemaining = winners[winnerIdx]?.netChips || 0;
    let loserOwing = Math.abs(losers[loserIdx]?.netChips || 0);

    while (winnerIdx < winners.length && loserIdx < losers.length) {
      const transferChips = Math.min(winnerRemaining, loserOwing);
      
      if (transferChips > 0) {
        transactions.push({
          from: losers[loserIdx].name,
          to: winners[winnerIdx].name,
          chips: transferChips,
          amount: transferChips * chipValueNum,
        });
      }

      winnerRemaining -= transferChips;
      loserOwing -= transferChips;

      if (winnerRemaining === 0) {
        winnerIdx++;
        winnerRemaining = winners[winnerIdx]?.netChips || 0;
      }

      if (loserOwing === 0) {
        loserIdx++;
        loserOwing = Math.abs(losers[loserIdx]?.netChips || 0);
      }
    }

    return transactions;
  };

  const transactions = calculateSettlements();
  const totalMoneyInvolved = transactions.reduce((sum, t) => sum + t.amount, 0);

  const markAsPaid = (from: string, to: string) => {
    const key = `${from}-${to}`;
    setPaidTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isPaid = (from: string, to: string) => {
    return paidTransactions.has(`${from}-${to}`);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-300 dark:border-green-700">
        <CardHeader className="p-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-green-600" />
            💰 Money Settlement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {/* Chip Value Input */}
          <div>
            <label className="text-xs font-medium mb-1 block">
              💵 Chip Value (Rs./chip)
            </label>
            <Input
              type="number"
              value={chipValue}
              onChange={(e) => setChipValue(e.target.value)}
              placeholder="Enter value"
              className="text-sm font-bold h-8"
            />
          </div>

          {/* Total Money Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-green-300 dark:border-green-700">
              <p className="text-xs text-muted-foreground">Total Money</p>
              <p className="text-sm font-black text-green-600 dark:text-green-400">
                Rs. {totalMoneyInvolved.toFixed(2)}
              </p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-700">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                {transactions.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Summary */}
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Player Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-1">
            {players.map((player, index) => (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-2 rounded border ${
                  player.netChips > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : player.netChips < 0
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.initialChips} → {player.finalChips}
                    </p>
                  </div>
                  <div className="text-right">
                    {player.netChips > 0 ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-bold text-sm">
                          +Rs. {(player.netChips * chipValueNum).toFixed(2)}
                        </span>
                      </div>
                    ) : player.netChips < 0 ? (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <TrendingDown className="h-3 w-3" />
                        <span className="font-bold text-sm">
                          -Rs. {(Math.abs(player.netChips) * chipValueNum).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-sm text-gray-600">
                        Rs. 0.00
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      ({player.netChips > 0 ? '+' : ''}{player.netChips})
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settlements/Transactions */}
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calculator className="h-4 w-4" />
            Who Pays Whom? 💸
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {transactions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>✅ No settlements needed!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction, index) => {
                const paid = isPaid(transaction.from, transaction.to);
                
                return (
                  <motion.div
                    key={`${transaction.from}-${transaction.to}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-2 rounded-lg border transition-all ${
                      paid
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600 opacity-60'
                        : 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-300 dark:border-orange-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-bold text-xs">{transaction.from}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-bold text-xs">{transaction.to}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400">
                              Rs. {transaction.amount.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ({transaction.chips} chips)
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => markAsPaid(transaction.from, transaction.to)}
                        variant={paid ? 'default' : 'outline'}
                        size="sm"
                        className={`h-7 ${paid ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      >
                        {paid ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            <span className="text-xs">Paid</span>
                          </>
                        ) : (
                          <span className="text-xs">Mark</span>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Settlement Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-300 dark:border-blue-700">
        <CardContent className="p-3">
          <h4 className="font-bold mb-2 text-center text-sm">📝 Summary</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between p-1.5 bg-white dark:bg-gray-800 rounded">
              <span>Players:</span>
              <span className="font-bold">{players.length}</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white dark:bg-gray-800 rounded">
              <span>Transactions:</span>
              <span className="font-bold">{transactions.length}</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white dark:bg-gray-800 rounded">
              <span>Money:</span>
              <span className="font-bold">Rs. {totalMoneyInvolved.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-1.5 bg-white dark:bg-gray-800 rounded">
              <span>Paid:</span>
              <span className="font-bold text-green-600">
                {paidTransactions.size} / {transactions.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-300 dark:border-yellow-700">
        <CardContent className="p-3">
          <h4 className="font-bold mb-1.5 text-center text-sm">💡 How to Use</h4>
          <ul className="text-xs space-y-0.5 text-muted-foreground">
            <li>✅ Set chip value (e.g., 1 chip = Rs. 10)</li>
            <li>✅ Check who owes whom</li>
            <li>✅ Make payments via UPI/Cash</li>
            <li>✅ Mark as paid & screenshot</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

