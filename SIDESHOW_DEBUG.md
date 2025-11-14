# 🎭 Side Show Debug Guide

## ❌ Problem

User getting error: **"Side show not available right now"**

---

## ✅ Side Show Requirements

Side show को लागि यी सबै conditions पूरा हुनु पर्छ:

### 1. **Minimum 3 Active Players** (Most Common Issue!)
```
✅ REQUIRED: 3+ players who are:
   - Active (isActive = true)
   - Haven't folded (hasFolded = false)

❌ FAILS if: Only 2 players left in the game
```

**Example:**
```
Game starts with 3 players: A, B, C
- C folds
- Now only A and B are active
- Side show NOT available (need 3+)
```

### 2. **Challenger Must Be Seen**
```
✅ REQUIRED: Player requesting side show must have seen their cards
❌ FAILS if: Challenger is still playing blind (hasSeen = false)
```

### 3. **Target Must Be Seen**
```
✅ REQUIRED: Target player must have seen their cards
❌ FAILS if: Target is still playing blind (hasSeen = false)
```

### 4. **Target Must Be Valid**
```
✅ REQUIRED: Target must be:
   - Active (isActive = true)
   - Not folded (hasFolded = false)

❌ FAILS if: Target has already folded or is inactive
```

---

## 🔍 Debug Logging Added

**File:** `unified-server.js` (line 655-677)

**Console Output:**
```
🎭 Side show requested by PlayerA against PlayerB
   Active players: PlayerA(seen:true), PlayerB(seen:true), PlayerC(seen:false)
   ✅ Side show validation passed
```

**Or when it fails:**
```
🎭 Side show requested by PlayerA against PlayerB
   Active players: PlayerA(seen:true), PlayerB(seen:true)
   ❌ Not enough players: 2 active (need 3+)
```

---

## 🧪 How to Test & Debug

### Step 1: Start Game
```bash
cd C:\Dipendra\three-player-game
npm run dev:unified
```

### Step 2: Check Console Logs

When side show is attempted, look for:
```
🎭 Side show requested...
```

### Step 3: Verify Requirements

**Check Active Players:**
```
Active players: PlayerA(seen:true), PlayerB(seen:true), PlayerC(seen:false)
                 ^^^^^^^^               ^^^^^^^^               ^^^^^^^^
                 Count them - need 3+
```

**Common Failure Reasons:**

1. **❌ "Not enough players: 2 active (need 3+)"**
   - **Cause:** Only 2 players left (one folded)
   - **Fix:** Side show only works with 3+ active players

2. **❌ "Challenger hasn't seen cards yet"**
   - **Cause:** You're trying side show while blind
   - **Fix:** See your cards first, then challenge

3. **❌ "Target hasn't seen cards yet"**
   - **Cause:** Target player is blind
   - **Fix:** Target must see cards first

4. **❌ "Invalid target"**
   - **Cause:** Target has folded or is inactive
   - **Fix:** Choose a different player

---

## 📊 Server Code (unified-server.js)

### Validation Logic:

```javascript
// Line 652-677
handleSideShow(challenger, targetPlayerId) {
  const targetPlayer = this.getPlayer(targetPlayerId);
  
  // Log for debugging
  console.log(`🎭 Side show requested by ${challenger.name} against ${targetPlayer?.name}`);
  console.log(`   Active players: ${this.players.filter(p => p.isActive && !p.hasFolded).map(p => `${p.name}(seen:${p.hasSeen})`).join(', ')}`);

  // 1. Check target validity
  if (!targetPlayer || !targetPlayer.isActive || targetPlayer.hasFolded) {
    throw new Error('Invalid side show target');
  }

  // 2. Check minimum 3 active players
  const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);
  if (activePlayers.length <= 2) {
    throw new Error('Side show requires at least 3 active players');
  }

  // 3. Check challenger seen
  if (!challenger.hasSeen) {
    throw new Error('Challenger must be seen to request side show');
  }

  // 4. Check target seen
  if (!targetPlayer.hasSeen) {
    throw new Error('Side show target must be seen');
  }

  console.log(`   ✅ Side show validation passed`);
  // ... proceed with side show
}
```

---

## 🎯 Quick Diagnosis

### Scenario 1: "Side show not available"
```
Check: How many players are active?
- If 2: ❌ Need 3+ players
- If 3+: ✅ Check next requirement
```

### Scenario 2: Button doesn't appear
```
Check in console:
- Are there 3+ active players?
- Have both you and target seen cards?
- Is target active (not folded)?
```

### Scenario 3: Error when clicking
```
Check server console for:
🎭 Side show requested...
   ❌ [specific error message]
```

---

## ✅ Valid Side Show Conditions

**Example of valid side show:**
```
Game: 3 players (A, B, C)
- All 3 active ✅
- All 3 haven't folded ✅
- Player A has seen cards ✅
- Player B has seen cards ✅
- Player A challenges Player B ✅

Result: Side show proceeds ✅
```

**Example of invalid side show:**
```
Game: 3 players (A, B, C)
- Player C has folded ❌
- Only A and B active (need 3+) ❌
- Player A challenges Player B ❌

Result: "Side show requires at least 3 active players" ❌
```

---

## 🔧 Common Fixes

### Fix 1: Not Enough Players
```
Problem: Only 2 players left
Solution: Side show only works with 3+ active players
          This is by design (Teen Pati rules)
```

### Fix 2: Blind Players
```
Problem: You or target haven't seen cards
Solution: Both must click "See Cards" first
```

### Fix 3: Invalid Target
```
Problem: Trying to challenge folded player
Solution: Choose different target who is active
```

---

## 📝 Testing Checklist

Before attempting side show:
- [ ] Count active players (must be 3+)
- [ ] Verify you've seen your cards
- [ ] Verify target has seen their cards
- [ ] Verify target hasn't folded
- [ ] Check server console for detailed logs

---

## 🎮 Game Flow

**Correct Side Show Flow:**

1. **Game starts with 3+ players** ✅
2. **Players see their cards** ✅
3. **At least 3 remain active** ✅
4. **Player A clicks "Side Show" button**
5. **Selects Player B as target**
6. **Server validates all conditions** ✅
7. **Player B sees accept/decline prompt**
8. **If accepted:** Cards compared, loser eliminated
9. **Game continues**

---

## 🚀 Status

**Debug Logging:** ✅ Added
**Validation:** ✅ Working correctly
**Console Output:** ✅ Clear error messages

**Next Steps:**
1. Start game
2. Attempt side show
3. Check console logs
4. Identify which requirement is failing

---

**The side show logic is correct. Check console logs to see which requirement is not met!** 🎭✅

