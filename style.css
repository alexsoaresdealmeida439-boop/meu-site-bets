
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
    color: #ffffff;
    font-family: 'Rajdhani', 'Segoe UI', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
}

/* BACKGROUND PREMIUM */
.premium-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        radial-gradient(circle at 20% 80%, rgba(120, 0, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(220, 20, 60, 0.05) 0%, transparent 50%);
    z-index: -2;
}

.gold-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        linear-gradient(45deg, transparent 65%, rgba(255, 215, 0, 0.03) 65%, rgba(255, 215, 0, 0.03) 70%, transparent 70%),
        linear-gradient(-45deg, transparent 65%, rgba(255, 215, 0, 0.03) 65%, rgba(255, 215, 0, 0.03) 70%, transparent 70%);
    background-size: 50px 50px;
    z-index: -1;
}

/* HEADER GÓTICO/PREMIUM */
.main-header {
    position: relative;
    padding: 30px 40px;
    background: linear-gradient(135deg, 
        rgba(10, 10, 10, 0.95) 0%, 
        rgba(26, 26, 46, 0.92) 50%, 
        rgba(22, 33, 62, 0.9) 100%);
    border-bottom: 3px solid;
    border-image: linear-gradient(45deg, #ffd700, #ff6b00, #ff0080, #9d00ff) 1;
    backdrop-filter: blur(10px);
}

.logo-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo-wrapper {
    text-align: left;
}

.main-logo {
    font-family: 'Rajdhani', sans-serif;
    font-size: 4rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffd700 0%, #ff6b00 25%, #ff0080 50%, #9d00ff 75%, #00ff88 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
    letter-spacing: 3px;
    margin-bottom: 5px;
    position: relative;
}

.main-logo::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, transparent, #ffd700, #ff0080, #9d00ff, transparent);
    border-radius: 2px;
}

.logo-subtitle {
    font-size: 1rem;
    color: #ffd700;
    font-weight: 300;
    letter-spacing: 8px;
    text-transform: uppercase;
    margin-top: 10px;
}

.header-graphic {
    display: flex;
    gap: 15px;
}

.graphic-element {
    font-size: 2rem;
    animation: float 3s ease-in-out infinite;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.graphic-element:nth-child(2) {
    animation-delay: 1s;
}

.graphic-element:nth-child(3) {
    animation-delay: 2s;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

/* LAYOUT DASHBOARD */
.dashboard {
    display: grid;
    grid-template-columns: 30% 60% 10%;
    gap: 0;
    min-height: 65vh;
    padding: 0;
    position: relative;
}

.left-column, .center-column, .right-column {
    padding: 25px;
    border-right: 1px solid rgba(255, 215, 0, 0.2);
    background: rgba(10, 10, 10, 0.7);
    backdrop-filter: blur(15px);
}

.right-column {
    border-right: none;
}

/* SEÇÃO TÍTULOS */
.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid;
    border-image: linear-gradient(90deg, #ffd700, transparent) 1;
}

.title-icon {
    font-size: 1.5rem;
}

.section-title h2 {
    font-size: 1.3rem;
    font-weight: 600;
    color: #ffd700;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* COLUNA ESQUERDA - JOGOS AO VIVO */
.live-games-container {
    position: relative;
    min-height: 300px;
}

.no-live-games {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 250px;
}

.empty-state {
    text-align: center;
    padding: 30px;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.7;
}

.empty-state h3 {
    color: #ffd700;
    font-size: 1.3rem;
    margin-bottom: 10px;
}

.empty-state p {
    color: #8899cc;
    font-size: 0.9rem;
}

.live-pulse {
    width: 20px;
    height: 20px;
    background: #ff0080;
    border-radius: 50%;
    margin: 20px auto;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(0.8); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(0.8); opacity: 1; }
}

/* JOGOS AO VIVO - QUANDO HOUVER */
.live-game-card {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 107, 0, 0.1) 100%);
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 12px;
    border: 1px solid rgba(255, 215, 0, 0.3);
    position: relative;
    overflow: hidden;
}

.live-game-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

.live-teams {
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 8px;
    color: #ffffff;
}

.live-score {
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffd700;
    text-align: center;
    margin: 8px 0;
}

.live-time {
    font-size: 0.8rem;
    color: #ff6b00;
    text-align: center;
    font-weight: 600;
}

/* COLUNA CENTRAL - HERO SECTION */
.welcome-section {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60vh;
}

.hero-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
    max-width: 900px;
}

.hero-content h3 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffd700 0%, #ff6b00 50%, #ff0080 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 20px;
    line-height: 1.2;
}

.hero-content p {
    font-size: 1.2rem;
    color: #8899cc;
    margin-bottom: 30px;
}

.premium-btn {
    background: linear-gradient(135deg, #ffd700 0%, #ff6b00 100%);
    color: #0c0c0c;
    border: none;
    padding: 15px 30px;
    border-radius: 30px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 5px 20px rgba(255, 215, 0, 0.3);
}

.premium-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5);
}

.hero-graphic {
    text-align: center;
    position: relative;
}

.graphic-man {
    font-size: 6rem;
    margin-bottom: 20px;
    animation: bounce 2s ease-in-out infinite;
}

.money-stack {
    font-size: 3rem;
    animation: shake 1s ease-in-out infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
}

@keyframes shake {
    0%, 100% { transform: rotate(-5deg); }
    50% { transform: rotate(5deg); }
}

/* COLUNA DIREITA - PERÍODO COMPACTO */
.right-column {
    padding: 20px 15px;
}

.period-nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
}

.period-btn {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    padding: 12px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    font-size: 0.8rem;
    color: #ffd700;
}

.period-btn:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateX(3px);
}

.empty-folders {
    text-align: center;
    padding: 30px 0;
    color: #8899cc;
}

.folder-icon {
    font-size: 2rem;
    margin-bottom: 10px;
    opacity: 0.5;
}

/* CAMPEONATOS PREMIUM */
.championships-section {
    padding: 40px;
    background: linear-gradient(135deg, rgba(10, 10, 10, 0.9) 0%, rgba(26, 26, 46, 0.8) 100%);
    border-top: 3px solid;
    border-image: linear-gradient(90deg, transparent, #ffd700, #ff0080, #9d00ff, transparent) 1;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 30px;
    justify-content: center;
}

.section-header h2 {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffd700 0%, #ff0080 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.championships-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.championship-card {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(157, 0, 255, 0.1) 100%);
    border-radius: 15px;
    padding: 25px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 215, 0, 0.2);
    position: relative;
    overflow: hidden;
}

.championship-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
}

.championship-card:hover::before {
    left: 100%;
}

.championship-card:hover {
    transform: translateY(-5px);
    border-color: #ffd700;
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.2);
}

.championship-name {
    font-weight: 700;
    font-size: 1.1rem;
    color: #ffd700;
    margin-bottom: 8px;
}

.championship-country {
    font-size: 0.85rem;
    color: #8899cc;
    font-weight: 500;
}

/* LOADING */
.loading-championships {
    text-align: center;
    padding: 40px;
    grid-column: 1 / -1;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 215, 0, 0.3);
    border-top: 4px solid #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* RESPONSIVO */
@media (max-width: 1024px) {
    .dashboard {
        grid-template-columns: 1fr;
    }
    
    .hero-section {
        grid-template-columns: 1fr;
        text-align: center;
    }
    
    .main-logo {
        font-size: 2.5rem;
    }
    
    .hero-content h3 {
        font-size: 2rem;
    }
}
