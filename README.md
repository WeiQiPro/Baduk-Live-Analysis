# Baduk Live Analysis (BLA)

**Baduk Live Analysis (BLA)** is a cutting-edge application that seamlessly marries the capabilities of OGS websockets with KataGo's power to provide unparalleled real-time game analysis.

Harnessing the agility of the Express framework, BLA presents an interactive user experience built on unique URL routes. Each route generates a transient database for its session, guaranteeing efficiency and rapid responsiveness.

## Key Features:

- **Real-time Interaction:** Experience immediate game updates after every move.

- **Comprehensive Analysis:** Stay informed at every game juncture with insights into:
   
  - **Game Details:** 
    - UUID
    - ID
    - Total queries made

  - **Player Insights:** 
    - Current Player's Turn
    - Names for Black and White players

  - **Game Dynamics:** 
    - Current Move Number
    - Blue Move
    - Overall Winrate
    - Individual Winrates for Black and White
    - Value of the Last Move

  - **Scoring Metrics:** 
    - Game Score
    - Territory allocations for Black and White
    - Score differential between competitors

Each interaction with KataGo results in the system dispatching a rich, game-specific analysis, assuring players and spectators are contemporaneously updated. Following this, the frontend client amends its visuals based on the broadcasted data. This ensures dynamic representation of critical metrics: for instance, the game board highlights the blue move with a distinct blue circle, and users can visualize game dynamics through the Winrate bar, Territory bar, Territory estimate, and a textual representation of the Score lead.

## Disclaimer

Designed with streamers and live streaming events at its core, BLA seeks to augment the live viewing experience through its real-time analytical offerings. We encourage individual users to leverage BLA, bearing in mind its intended primary application. When incorporating BLA into public broadcasts, we kindly ask for appropriate credits and acknowledgments.