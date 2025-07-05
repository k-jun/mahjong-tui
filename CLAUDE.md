# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mahjong TUI is a terminal-based mahjong game written in TypeScript using Deno. The project consists of:

- **Server**: WebSocket-based game server using Socket.IO
- **Client**: React-based TUI client using Ink for terminal UI
- **Models**: Core game logic for mahjong rules and game state
- **Fixtures**: Test data from Tenhou game logs for validation

## Architecture

The codebase follows a client-server architecture:

1. **Server** (`server/`): Handles room management, player connections, and game orchestration
2. **Client** (`client/`): Terminal UI that connects to server and renders game state
3. **Models** (`models/`): 
   - `mahjong.ts`: Core game logic and state management
   - `room.ts`: Room and user management
   - `mahjong_user.ts`: Player-specific game state
   - `cpu.ts`: AI player implementation
4. **Utils** (`utils/`): Shared utilities and constants

## Common Commands

### Development
```bash
# Run server (localhost:8080)
deno run -A server/main.ts

# Run client (connects to https://mahjong-tui.k-jun.net:443 by default)
deno run -A client/main.tsx

# Run tests
deno test -A

# Lint code
deno lint

# Format code
deno fmt
```

### Client Build & Release
```bash
cd client
npm run build
npm publish
```

### Docker Build
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/k-jun/mahjong-tui:latest --push .
```

## Key Technical Details

- **Runtime**: Deno with TypeScript
- **Client UI**: React + Ink for terminal rendering
- **Server**: Socket.IO for real-time communication
- **Game Logic**: Uses `@k-jun/mahjong` JSR package for core mahjong rules
- **Testing**: Validates game logic against real Tenhou game logs in `fixtures/`
- **Mahjong Notation**: Uses abbreviated notation (m/p/s for suits, r for red dora)

## File Structure Notes

- Game state is managed through `MahjongInput` enum actions
- Each player position has separate TSX components (jicha/toimen/kamicha/shimocha)
- CPU players automatically fill empty slots with 20-second timeout
- Room management uses mutex for thread-safe operations
- Test files validate game logic against XML fixtures from Tenhou
