# league client ts
A feature rich league client written is TypeScript

## Prerequisites
- TypeScript - [Download & Install TypeScript](https://www.typescriptlang.org/download). Used for compiling and the TypeScript enviroment
```
$ npm install -g typescript
```

## Installing the client from source
```
$ git clone https://github.com/cactoes/league_client_ts.git
$ cd league_client_ts
$ npm install
```

## Running the client from source
Run & Compile the source
```
$ npm run test
```
## Scripting
The client allows for function scripting, the script is located in data
### Structure
```javascript
class LCScript {
  // when the game launches onUserConnect is called
  async onUserConnect(user, lobby) {
    return true
  }

  // when user joins a party onPartyJoin is called
  async onPartyJoin(user, lobby) {
    return true
  }
}
```

### Methods
Methods are called like this
```Javascript
await user.setStatus("example")
```
#### Methods in *user*
[IUser](src/types.d.ts#L158) class
```TypeScript
async function setStatus(status: string): Promise<IUser>
async function setRank(tier: string, rank: string): Promise<IUser>
```
#### Methods in *lobby*
[ILobby](src/types.d.ts#L283) class
```TypeScript
async function setLanes(first: string, second: string): void
async function create(queueId: number): Promise<ILobby>
async function setPartyType(type: string): void
async function startSearch(): void
async function stopSearch(): void
```

## License
[GNU GPLv3](LICENSE)