# `@ubiquity-os/permit-generation`

- The purpose of this module is to isolate the bot's payment capabilities.
- This can be directly invoked from other plugins [^1^].

## V1 Technical Specification

### Input

The input should be an array of permit descriptors:

```typescript
type PermitGenerationInput {
  username: string;
  amount: string;
  address: string;
  task: GitHubIssue | null;
  transfer: boolean;
  evmPrivateKeyEncrypted: string;
}[]
```

###### Remarks

Mixed feelings on the following:

- `task` - Payments can possibly be for any reason from any plugin developer in our ecosystem, but in the foreseeable future (for V1) I think that they should be associated with a GitHub issue, or nothing.
- `transfer` - For automatically transferring the funds vs generating a permit. If we have access to the private key, we have the ability to make a transfer on their behalf.

General remarks:

- `evmPrivateKeyEncrypted` - I researched GitHub App permissions and its a boolean for all organization secrets or none; or all repository secrets or none. I think that partners may be weary to share ALL secrets so perhaps it makes sense to proceed with the `X25519` `evmPrivateKeyEncrypted` system.

### Processing

###### Data validation

1. Look up the GitHub global user ID (number) that corresponds with the username. Check if a user ID exists (does the user exist?), otherwise log an error and proceed. [^2^]
1. Look up the registered wallet address of the user from our database. [^3^]
1. Parse the amount and see if its a valid number.
1. ~~Look up the address on chain to see if a token exists there. If not, throw an error.~~
1. Verify that the `task.id` exists on GitHub. If not, throw an error. If it is `null` then skip this validation.
1. Record all the results in our database. `public.permits`

### Return

Return value should just be an array of generated permits. A separate module can convert them into URLs for pay.ubq.fi.

[^1^]: I put a lot of thought into this and unless the plugins can hack X25519 encryption I think its fine for them to attempt brute forcing etc. In exchange its simpler infrastructure vs only accepting requests from the kernel (which seems more secure, but for V1 perhaps unnecessary.)

[^2^]: We pass in the username for enhanced developer experience for plugin development. I believe it will be much easier to use GitHub usernames and let the system do the lookup.

[^3^]: Mixed feelings on this lookup because it does not self encapsulate this module well. We already have an optional database write for the permit record, but this plugin WILL break if there is a database issue for reading the user's registered wallet, which can make testing and development more difficult here. The alternative is to pass in the user's wallet here, but then the kernel (or another plugin) needs to look up their wallet address (this seems like the better approach.)

Generate a permit:

1. Terminal A: `bun worker`
2. Set your `X25519_PRIVATE_KEY` to the same one used in the tests.
3. Terminal B: Start anvil: `anvil --fork-url https://rpc.gnosis.gateway.fm --chain-id 31337`
4. Terminal C: run the following command:

```
curl -X POST http://localhost:4000 -H "Content-Type: application/json" -d '{"settings":{"evmPrivateEncrypted":"wOzNgt-yKT6oFlOVz5wrBLUSYxAbKGE9Co-yvT8f9lePsx7wJwPVugS9186zdhr1T4UpkpXvq9ii5M-nWfrydMnllSkowH4LirRZsHbvRVSvDoH_uh80p6HpwqDSG3g4Nwx5q0GD3H-ne4vwXMuwWAHd","permitRequests":[{"type":"ERC20","userId":106303466,"amount":1,"evmNetworkId":31337,"tokenAddress":"0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d","issueNodeId":"0x123"}]}}'
```
