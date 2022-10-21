# Blog Read Me

The Blog could be considered its own application. It has it's own state, and is the only part of the site that utilizes a server and database. I wanted to include it to provide much greater context surrounding the projects I work on. I often generate extensive notes while working through programs or reading books, and I thought why not publish that for myself, and for anyone who happens to be working on a similar problem. The blog will have the longest feature list, so expect to see new updates and tweaks regularly. I'll be sure to write a post on how I integrated the Notion SDK.

## Blog Posts

### Notes
- I'm moving the fullstack search and filtering capabilities to post-launch goals. I have such minimal content at the moment, that optimization is not a concern. I can simply fetch all posts, and then filter and sort locally. This will reduce back and forth trips to server and db. This would need to be changed as I add content. I probably shouldn't fetch more than 50 or so blogs at a time. But I don't expect to have that many for at least 6 months.

- It's also very possible that I'll change db's at some point, I'll deploy this and see how it goes, but if I switch to postgres then I can build out a more sophisticated search process at that time.

## Tweets

### Notes
- More of  hastle than anticipated. The embedded tweets are sending cookies, https requests and opening web socket connections -- they look nice though. Long term plan is to just format a component myself with the data. I don't want them embeded with a live connection to twitter. the main potential problem is displaying images and videos. It's possible I'll have to give up on that and just show the text. Maybe link the component itself to twitter and say 'click to see full tweet'. I'll come back to it. Displaying tweets isn't a primary purpose so I'm fine with having semi-functional tweet viewing experience.

- Removed pagination for blog posts. I'll build a comprehensive pagination feature after deployment. I don't even have enough posts to paginate yet so why bother.


