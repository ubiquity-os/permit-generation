# `@ubiquibot/permit-generation`

- The purpose of this module is to isolate the permit generation capabilities. 
- For security reasons, only the `ubiquibot-kernel` should be able to communicate with this (instead of plugins being able to invoke this directly.)


## V1 Specification

### Input

The input should be an array of permit descriptors:

```json
{ 
  username: string;
  amount: string;
  address: string;
  task: GitHubIssue | null; 
}[]
```

### Processing

####### Data Validation

1. Look up the GitHub global user ID (number) that corresponds with the username. Check if a user ID exists (does the user exist?), otherwise log an error and proceed. [^1^]
2. Parse the amount and see if its a valid number.
3. ~~Look up the address on chain to see if a token exists there. If not, throw an error.~~
4. Verify that the `task.id` exists on GitHub. If not, throw an error. 
5. Record all the results in our database. `public.permits`

[^1^]: we pass in the username for enhanced developer experience for plugin development. I believe it will be much easier to use GitHub usernames and let the system do the lookup. 
