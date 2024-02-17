# `@ubiquibot/permit-generation`

- The purpose of this module is to isolate the bot's payment capabilities. 
- For security reasons, only the `ubiquibot-kernel` should be able to communicate with this (instead of plugins being able to invoke this directly.) [^1^]

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
  evmPrivateKeyEncrypted
}[]
```
###### Remarks

Mixed feelings on the following:

- `task` - Payments can possibly be for any reason from any plugin developer in our system, but in the foreseeable future (for V1) I think that they should be associated with a GitHub issue, or not. 
- `transfer` - For automatically transferring the funds vs generating a permit. If we have access to the private key, we have the ability to make a transfer on their behalf. 

### Processing  

###### Data validation

1. Look up the GitHub global user ID (number) that corresponds with the username. Check if a user ID exists (does the user exist?), otherwise log an error and proceed. [^2^]
2. Parse the amount and see if its a valid number.
3. ~~Look up the address on chain to see if a token exists there. If not, throw an error.~~
4. Verify that the `task.id` exists on GitHub. If not, throw an error. If it is `null` then skip this validation.
5. Record all the results in our database. `public.permits`

###### Other

- We need to instruct partner repositories to enable access to repository/organization secrets, especially for `evmPrivateKey`
- The bot should read the secret directly by authenticating based on the installation ID, app private key, and app ID. 

### Return

Return value should just be an array of generated permits. A seperate module can convert them into URLs for pay.ubq.fi. 

[^1^]: I have mixed feelings on this because I trust encryption to handle this, but intuitively I believe it makes sense to create a wall from the payments system for the plugin developer community. Perhaps we can check the IP address of the Cloudflare Worker or some other better built in authentication mechanism. 
[^2^]: We pass in the username for enhanced developer experience for plugin development. I believe it will be much easier to use GitHub usernames and let the system do the lookup. 
