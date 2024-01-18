## Cache Fetch

This directory is designed so that every "dep" in "deps" DOES NOT import from any other dep. The index.ts here brings all the isolated concepts and ideas within each of the dep files. Deps only import npm modules and other sibling typings.