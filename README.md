# LCTS (League Client TypeScript)
A feature rich league client written in TypeScript, with scripting & more 

## Installing the client
Just download the client from the [releases](https://github.com/cactoes/lcts/releases) tab & run 'lcts.exe'

## A glass style UI
![ui](images/ui.gif)

## A x88 style overlay
![overlay](images/overlay.png)

## Prerequisites
If you want to run the client from source make sure you have:
- TypeScript - [Download & Install TypeScript](https://www.typescriptlang.org/download). Used for compiling and the TypeScript enviroment
```
$ npm install -g typescript
```

## Installing the client from source
```
$ git clone https://github.com/cactoes/lcts.git
$ cd lcts
$ npm install
```

## Running the client from source
Run & Compile the source
```
$ npm run test
```

## Compiling the client
Run & Compile the source
```
$ npm run package:win
```

## Scripting
The client allows for function scripting (within LCTS itself), the script is located in [resources/data/script.js](resources/data/script.js)
### Structure
```javascript
class LCScript {
  // when the game launches
  async onUserConnect(user, lobby, config) {
    // your code goes here
    return true
  }

  // when user joins a party
  async onPartyJoin(user, lobby, config) {
    // your code goes here
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
- [IUser](src/types.d.ts#L158) Interface/Type
```TypeScript
async function setStatus(status: string): Promise<IUser>
async function setRank(tier: string, rank: string): Promise<IUser>
```
#### Methods in *lobby*
- [ILobby](src/types.d.ts#L283) Interface/Type
```TypeScript
async function setLanes(first: string, second: string): Promise<void>
async function create(queueId: number): Promise<ILobby>
async function leave(): Promise<void>
async function setPartyType(type: string): Promise<void>
async function startSearch(): Promise<void>
async function stopSearch(): Promise<void>
```
#### Config
All the saved config data at that moment in [config.json](resources/data/config.json)

## Contributing 
Steps for contributing
- choose a [task](TODO.md) / or come up with a new task
- contact me (cactus#9276) so i can link you to the task
- fork the project
- make changes (and document your code + add any types needed)
- upload for reviewing

## License
[GNU GPLv3](LICENSE)