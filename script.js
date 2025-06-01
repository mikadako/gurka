class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = rank === 1 ? 14 : rank; // Ace is high (14)
    }

    getDisplayRank() {
        if (this.rank === 1) return 'A';
        if (this.rank === 11) return 'J';
        if (this.rank === 12) return 'Q';
        if (this.rank === 13) return 'K';
        return this.rank.toString();
    }

    getSuitSymbol() {
        const suits = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };
        return suits[this.suit];
    }

    isRed() {
        return this.suit === 'hearts' || this.suit === 'diamonds';
    }
}

class Player {
    constructor(name, isHuman = false) {
        this.name = name;
        this.isHuman = isHuman;
        this.hand = [];
        this.score = 0;
        this.eliminated = false;
    }

    sortHand() {
        this.hand.sort((a, b) => a.value - b.value);
    }

    getLowestCard() {
        return this.hand[0];
    }

    getValidCards(highCard) {
        const lowestCard = this.getLowestCard();
        const validCards = [];
        
        if (!highCard) {
            return this.hand;
        }

        validCards.push(lowestCard);
        
        const higherCards = this.hand.filter(card => card.value > highCard.value);
        if (higherCards.length > 0) {
            validCards.push(higherCards[0]);
        }
        
        return validCards;
    }

    playCard(card) {
        const index = this.hand.findIndex(c => 
            c.suit === card.suit && c.rank === card.rank
        );
        if (index > -1) {
            return this.hand.splice(index, 1)[0];
        }
        return null;
    }
}

class GurkaGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.trickCards = [];
        this.trickPlayers = [];
        this.deck = [];
        this.highCard = null;
        this.highCardPlayerIndex = null;
        this.gameActive = false;
        this.roundNumber = 0;
        this.playerPiles = {};
        this.playedCards = new Set(); // Track all played cards
        this.remainingCardsByValue = {}; // Track remaining cards by value
        this.playerMinimumCard = {}; // Track minimum possible card for each player
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const startButton = document.getElementById('start-game');
        console.log('Start button:', startButton);
        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('Start button clicked');
                this.startGame();
            });
        } else {
            console.error('Start button not found!');
        }
        
        const continueButton = document.getElementById('continue-button');
        if (continueButton) {
            continueButton.addEventListener('click', () => {
                this.continueAfterRound();
            });
        }
    }

    generateFunnyNames() {
        const allNames = ['Grattgård', 'Lansén', 'Henry Florén', 'Janne Rundquist', 'Charlie', 'Andy', 'Bosse Andersson', 'Torgny', 'Kalle Klöver'];
        const shuffled = [...allNames];
        
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }

    startGame() {
        console.log('startGame called');
        const playerCountInput = document.getElementById('player-count');
        console.log('Player count input:', playerCountInput);
        const playerCount = parseInt(playerCountInput.value);
        console.log('Player count:', playerCount);
        if (playerCount < 2 || playerCount > 8) {
            alert('Välj mellan 2 och 8 spelare');
            return;
        }

        this.players = [new Player('Du', true)];
        
        const funnyNames = this.generateFunnyNames();
        for (let i = 0; i < playerCount - 1; i++) {
            this.players.push(new Player(funnyNames[i], false));
        }

        const setupScreen = document.getElementById('setup-screen');
        const gameScreen = document.getElementById('game-screen');
        
        console.log('Setup screen:', setupScreen);
        console.log('Game screen:', gameScreen);
        
        if (setupScreen && gameScreen) {
            setupScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            console.log('Screens switched');
        } else {
            console.error('Could not find screens!');
            return;
        }
        
        this.gameActive = true;
        console.log('About to start new round');
        this.startNewRound();
    }

    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const deck = [];
        
        for (const suit of suits) {
            for (let rank = 1; rank <= 13; rank++) {
                deck.push(new Card(suit, rank));
            }
        }
        
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        return deck;
    }

    startNewRound() {
        this.roundNumber++;
        this.deck = this.createDeck();
        this.trickCards = [];
        this.trickPlayers = [];
        this.highCard = null;
        this.highCardPlayerIndex = null;
        this.playedCards.clear();
        
        // Initialize card counting
        this.remainingCardsByValue = {};
        for (let i = 2; i <= 14; i++) {
            this.remainingCardsByValue[i] = 4; // 4 of each rank in deck
        }
        
        // Initialize player piles and minimum card tracking
        this.players.forEach((player, index) => {
            this.playerPiles[index] = [];
            this.playerMinimumCard[index] = 2; // Reset to lowest possible
        });
        
        this.players.forEach(player => {
            if (!player.eliminated) {
                player.hand = [];
                for (let i = 0; i < 6; i++) {
                    player.hand.push(this.deck.pop());
                }
                player.sortHand();
            }
        });
        
        this.updateDisplay();
        
        if (!this.players[this.currentPlayerIndex].eliminated) {
            this.nextTurn();
        } else {
            this.findNextActivePlayer();
            this.nextTurn();
        }
    }

    findNextActivePlayer() {
        let attempts = 0;
        while (this.players[this.currentPlayerIndex].eliminated && attempts < this.players.length) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
        }
    }

    nextTurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        if (currentPlayer.eliminated) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            this.nextTurn();
            return;
        }
        
        document.getElementById('current-player').textContent = 
            `Spelare: ${currentPlayer.name}`;
        
        if (currentPlayer.isHuman) {
            this.highlightValidCards();
        } else {
            setTimeout(() => this.makeComputerMove(), 1000);
        }
    }

    highlightValidCards() {
        const player = this.players[0];
        const validCards = player.getValidCards(this.highCard);
        
        const cardElements = document.querySelectorAll('#player-hand .card');
        cardElements.forEach((element, index) => {
            const card = player.hand[index];
            const isValid = validCards.some(vc => 
                vc.suit === card.suit && vc.rank === card.rank
            );
            
            if (isValid) {
                element.classList.add('playable');
                element.classList.remove('disabled');
                element.onclick = () => this.humanPlayCard(card);
            } else {
                element.classList.remove('playable');
                element.classList.add('disabled');
                element.onclick = null;
            }
        });
    }

    humanPlayCard(card) {
        const player = this.players[0];
        const playedCard = player.playCard(card);
        
        if (playedCard) {
            this.playCard(0, playedCard);
        }
    }

    makeComputerMove() {
        const player = this.players[this.currentPlayerIndex];
        const validCards = player.getValidCards(this.highCard);
        
        // Use strategic decision making
        const cardToPlay = this.chooseStrategicCard(this.currentPlayerIndex, validCards);
        const playedCard = player.playCard(cardToPlay);
        
        if (playedCard) {
            this.playCard(this.currentPlayerIndex, playedCard);
        }
    }
    
    chooseStrategicCard(playerIndex, validCards) {
        const player = this.players[playerIndex];
        const cardsInHand = player.hand.length;
        const tricksLeft = cardsInHand;
        const activePlayers = this.getActivePlayers();
        
        // Special handling for last trick
        if (tricksLeft === 1) {
            // On last trick, play the only card we have
            return validCards[0];
        }
        
        // Calculate danger scores for each valid card
        const cardScores = validCards.map(card => {
            return {
                card: card,
                score: this.evaluateCard(playerIndex, card, tricksLeft)
            };
        });
        
        // Sort by score (higher is better)
        cardScores.sort((a, b) => b.score - a.score);
        
        // Add some randomness to avoid being too predictable
        const topChoices = cardScores.filter(cs => cs.score >= cardScores[0].score - 10);
        const choice = topChoices[Math.floor(Math.random() * topChoices.length)];
        
        return choice.card;
    }
    
    evaluateCard(playerIndex, card, tricksLeft) {
        const player = this.players[playerIndex];
        let score = 0;
        
        // Check if we have an ace
        const hasAce = player.hand.some(c => c.value === 14);
        
        // Base scoring
        if (!this.highCard) {
            // Starting a trick
            if (hasAce && tricksLeft > 2) {
                // Try to get rid of ace early
                if (card.value === 14) {
                    score += 100;
                } else if (card.value > 10) {
                    // Play high cards early when we have ace
                    score += 50;
                }
            } else {
                // Normal play - prefer middle cards
                if (card.value >= 6 && card.value <= 10) {
                    score += 40;
                }
            }
        } else {
            // Following in a trick
            if (card === player.getLowestCard()) {
                // Playing lowest card
                score += this.evaluateLowestCardPlay(playerIndex, card, tricksLeft);
            } else {
                // Playing higher than current high
                score += this.evaluateHighCardPlay(playerIndex, card, tricksLeft);
            }
        }
        
        // Penalty for playing ace late in the game
        if (card.value === 14 && tricksLeft <= 2) {
            score -= 200;
        }
        
        // Consider opponent scores
        score += this.considerOpponentScores(playerIndex, card);
        
        return score;
    }
    
    evaluateLowestCardPlay(playerIndex, card, tricksLeft) {
        let score = 0;
        const player = this.players[playerIndex];
        const hasAce = player.hand.some(c => c.value === 14);
        
        // If we have an ace, we want to avoid being forced to play it
        if (hasAce && tricksLeft <= 3) {
            // Playing lowest is risky when we have ace
            score -= 30;
        } else {
            // Generally safe to play lowest
            score += 30;
        }
        
        // If our lowest is very low, it's usually safe
        if (card.value <= 5) {
            score += 20;
        }
        
        return score;
    }
    
    evaluateHighCardPlay(playerIndex, card, tricksLeft) {
        let score = 0;
        const player = this.players[playerIndex];
        
        // Check how many higher cards are still out there
        const higherCardsOut = this.countHigherCardsRemaining(card.value);
        
        // If few higher cards remain, this is risky
        if (higherCardsOut <= 2) {
            score -= 40;
            
            // Extra penalty for last few tricks
            if (tricksLeft <= 2) {
                score -= 60;
            }
        }
        
        // If we can force someone with high cards
        if (this.canForceOpponentWithHighCard(playerIndex, card)) {
            score += 50;
        }
        
        // Prefer to take control early if we have dangerous cards
        if (player.hand.some(c => c.value >= 12) && tricksLeft > 3) {
            score += 20;
        }
        
        return score;
    }
    
    countHigherCardsRemaining(value) {
        let count = 0;
        for (let v = value + 1; v <= 14; v++) {
            count += this.remainingCardsByValue[v] || 0;
        }
        return count;
    }
    
    canForceOpponentWithHighCard(playerIndex, card) {
        // Check if playing this card might force an opponent with known high cards
        const nextPlayerIndex = (playerIndex + 1) % this.players.length;
        const nextPlayer = this.players[nextPlayerIndex];
        
        if (nextPlayer.eliminated) return false;
        
        // If we know their minimum card is high
        const minCard = this.playerMinimumCard[nextPlayerIndex];
        if (minCard && minCard >= 10) {
            return true;
        }
        
        return false;
    }
    
    considerOpponentScores(playerIndex, card) {
        let score = 0;
        
        // Check opponents close to elimination
        this.players.forEach((opponent, idx) => {
            if (idx === playerIndex || opponent.eliminated) return;
            
            // If opponent is close to 50 points
            if (opponent.score >= 40) {
                // Be more aggressive if we're not in danger
                if (this.players[playerIndex].score < 30) {
                    score += 10;
                }
            }
            
            // If opponent has high score and might have ace
            if (opponent.score >= 35 && !this.hasPlayedAce(idx)) {
                // Try to force them to play high
                score += 5;
            }
        });
        
        return score;
    }
    
    hasPlayedAce(playerIndex) {
        const pile = this.playerPiles[playerIndex] || [];
        return pile.some(card => card.value === 14);
    }

    playCard(playerIndex, card) {
        this.trickCards.push(card);
        this.trickPlayers.push(playerIndex);
        
        // Add card to player's pile
        this.playerPiles[playerIndex].push(card);
        
        // Track played cards
        this.playedCards.add(`${card.value}-${card.suit}`);
        this.remainingCardsByValue[card.value]--;
        
        // Update minimum card knowledge
        this.updateMinimumCardKnowledge(playerIndex, card);
        
        if (!this.highCard || card.value > this.highCard.value) {
            this.highCard = card;
            this.highCardPlayerIndex = playerIndex;
        }
        
        this.updateDisplay();
        
        if (this.trickCards.length === this.getActivePlayers().length) {
            setTimeout(() => this.endTrick(), 1500);
        } else {
            do {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            } while (this.players[this.currentPlayerIndex].eliminated);
            
            this.nextTurn();
        }
    }
    
    updateMinimumCardKnowledge(playerIndex, playedCard) {
        const player = this.players[playerIndex];
        
        // If player played their lowest card when they could have played higher
        if (this.highCard && playedCard === player.getLowestCard()) {
            // We now know their new minimum is at least the next card in their hand
            if (player.hand.length > 0) {
                this.playerMinimumCard[playerIndex] = player.hand[0].value;
            }
        }
        
        // If they played higher than the high card, we know their lowest is at most that value
        if (this.highCard && playedCard.value > this.highCard.value) {
            const currentMin = this.playerMinimumCard[playerIndex] || 2;
            this.playerMinimumCard[playerIndex] = Math.max(currentMin, playedCard.value);
        }
    }

    getActivePlayers() {
        return this.players.filter(p => !p.eliminated);
    }

    endTrick() {
        const activePlayers = this.getActivePlayers();
        
        if (activePlayers.every(p => p.hand.length === 0)) {
            this.endRound();
        } else {
            this.currentPlayerIndex = this.highCardPlayerIndex;
            this.trickCards = [];
            this.trickPlayers = [];
            this.highCard = null;
            this.highCardPlayerIndex = null;
            this.updateDisplay();
            this.nextTurn();
        }
    }

    endRound() {
        const lastTrickWinners = [];
        let highestValue = 0;
        
        this.trickCards.forEach((card, index) => {
            if (card.value > highestValue) {
                highestValue = card.value;
                lastTrickWinners.length = 0;
                lastTrickWinners.push(this.trickPlayers[index]);
            } else if (card.value === highestValue) {
                lastTrickWinners.push(this.trickPlayers[index]);
            }
        });
        
        let messages = [];
        
        lastTrickWinners.forEach(playerIndex => {
            const player = this.players[playerIndex];
            const card = this.trickCards[this.trickPlayers.indexOf(playerIndex)];
            
            if (card.value === 14) {
                player.eliminated = true;
                messages.push(`${player.name} fick ett ess och är utslagen!`);
            } else {
                player.score += card.value;
                messages.push(`${player.name} fick ${card.value} poäng!`);
                if (player.score >= 50) {
                    player.eliminated = true;
                    messages.push(`${player.name} har ${player.score} poäng och är utslagen!`);
                }
            }
        });
        
        this.updateScoreboard();
        
        // Show continue button with messages
        this.showRoundEndModal(messages);
    }
    
    showRoundEndModal(messages) {
        const modal = document.getElementById('round-end-modal');
        const messageDiv = document.getElementById('round-end-message');
        messageDiv.innerHTML = messages.join('<br>');
        modal.classList.remove('hidden');
    }
    
    continueAfterRound() {
        const modal = document.getElementById('round-end-modal');
        modal.classList.add('hidden');
        
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length === 1) {
            this.gameOver(activePlayers[0]);
        } else if (activePlayers.length === 0) {
            const gameStatus = document.getElementById('game-status');
            gameStatus.innerHTML = '<div class="winner-message">Alla spelare utslagen! Spelet är slut!</div>';
            this.gameActive = false;
        } else {
            do {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            } while (this.players[this.currentPlayerIndex].eliminated);
            
            this.startNewRound();
        }
    }

    gameOver(winner) {
        const gameStatus = document.getElementById('game-status');
        gameStatus.innerHTML = `<div class="winner-message">${winner.name} vann!</div>`;
        this.gameActive = false;
    }

    updateDisplay() {
        this.updatePlayerHand();
        this.updatePlayerPiles();
        this.updateScoreboard();
    }

    updatePlayerHand() {
        const handDiv = document.getElementById('player-hand');
        const player = this.players[0];
        
        handDiv.innerHTML = '';
        
        player.hand.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            if (card.isRed()) cardDiv.classList.add('red');
            
            cardDiv.innerHTML = `
                <div class="card-corner">
                    <div class="card-corner-rank">${card.getDisplayRank()}</div>
                    <div class="card-corner-suit">${card.getSuitSymbol()}</div>
                </div>
                <div class="card-rank">${card.getDisplayRank()}</div>
                <div class="card-suit">${card.getSuitSymbol()}</div>
            `;
            
            handDiv.appendChild(cardDiv);
        });
    }

    updatePlayerPiles() {
        const pilesDiv = document.getElementById('player-piles');
        pilesDiv.innerHTML = '';
        
        this.players.forEach((player, index) => {
            const pileDiv = document.createElement('div');
            pileDiv.className = 'player-pile';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'pile-name';
            if (player.eliminated) {
                nameDiv.classList.add('eliminated');
            }
            nameDiv.textContent = player.name;
            if (!player.eliminated) {
                nameDiv.textContent += ` (${player.hand.length} kort)`;
            }
            
            const cardsDiv = document.createElement('div');
            cardsDiv.className = 'pile-cards';
            
            const playerCards = this.playerPiles[index] || [];
            playerCards.forEach((card, cardIndex) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card pile-card';
                if (card.isRed()) cardDiv.classList.add('red');
                
                // Check if this is the current high card
                if (this.highCard && card === this.highCard && this.trickCards.includes(card)) {
                    cardDiv.classList.add('high-card');
                }
                
                cardDiv.style.left = `${cardIndex * 25}px`;
                cardDiv.style.zIndex = cardIndex;
                
                cardDiv.innerHTML = `
                    <div class="card-corner">
                        <div class="card-corner-rank">${card.getDisplayRank()}</div>
                        <div class="card-corner-suit">${card.getSuitSymbol()}</div>
                    </div>
                    <div class="card-rank">${card.getDisplayRank()}</div>
                    <div class="card-suit">${card.getSuitSymbol()}</div>
                `;
                
                cardsDiv.appendChild(cardDiv);
            });
            
            pileDiv.appendChild(nameDiv);
            pileDiv.appendChild(cardsDiv);
            pilesDiv.appendChild(pileDiv);
        });
    }
    
    updateScoreboard() {
        const scoresDiv = document.getElementById('scores');
        scoresDiv.innerHTML = '';
        
        this.players.forEach(player => {
            const scoreRow = document.createElement('div');
            scoreRow.className = 'score-row';
            if (player.eliminated) scoreRow.classList.add('eliminated');
            
            scoreRow.innerHTML = `
                <span>${player.name}</span>
                <span>${player.score} poäng</span>
            `;
            
            scoresDiv.appendChild(scoreRow);
        });
    }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    try {
        game = new GurkaGame();
        console.log('Game created successfully');
    } catch (error) {
        console.error('Error creating game:', error);
    }
});