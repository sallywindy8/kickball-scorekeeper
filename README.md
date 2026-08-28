# Kickball Score Keeper

I am currently on a kickball team and want to build a tool that can tally and keep track of Balls, Strikes, Fouls, and Outs for the umpires.

The rules are similar to baseball but there are some differences.
There are 7 innings. Each inning is separated by two parts: the top of the inning, and the bottom of the inning.
The game starts at the top of the 1st inning.
Balls, Strikes, and Fouls count separately. For example, fouls do not count as strikes.
When 4 Balls are counted, the batter is walked to first base and the next batter is up. The Ball counter is then reset.
When 3 Strikes are counted, that becomes 1 out. The Strikes counter is then reset.
When 3 Fouls are counted, that becomes 1 out. The Fouls counter is then reset. Fouls NEVER count as strikes.

When 3 outs are counted, the top of the inning ends, then the bottom of the inning begins. In the bottom of the inning, when 3 outs are counted, the game then moves to the top of the 2nd inning, and so forth.

Can you help me plan this?

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ad94d807-3784-4c19-9c17-7f48f5b1d88f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
