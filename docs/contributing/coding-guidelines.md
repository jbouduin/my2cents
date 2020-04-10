### Coding guidelines

#### Following rules have to be strictly followed
- do not try to show off. If I can not understand your code, even when documented, I won't merge it.
- no tabs, use spaces
- classes in the object directory have no methods
- import/export
  - use appropriately index.ts files (see objects/configuration for what I call appropriately) to export  
- code has to pass Lint (this is the majority of rules)
  - tslint.json extends tslint:recommended.
  - if you want to change tslint.json: convince me
  - npm run lint will do the job
  - if you use ts-lint disable, explain why (comment)

#### Following rules are personal preferences and it would be nice if you follow them. If you don't: no problem.
- initialize class properties in the constructor, not when defining them
- imports
  - are ordered and grouped by 'distance'
    - node_modules
    - own classes '../../../xx' before '../../xx' before '../xx' before './'
    - constants
  - do not import from '.'. In that case reference the file.
  - logically group imports.
- indent = 2 spaces  

---
[Table of Contents](/docs/documentation.md)
