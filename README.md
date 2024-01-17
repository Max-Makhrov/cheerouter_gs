# cheerouter_gs
Makes your life easier when working with Cheerio using Apps Script.

## Install

1. copy cheerio https://github.com/Max-Makhrov/cheerouter_gs/blob/main/cheerio.gs
2. copy cheetouter https://github.com/Max-Makhrov/cheerouter_gs/blob/main/cheerouter.gs

Alternative setup

Copy sample script: https://script.google.com/u/0/home/projects/1jNXUPsIyWiV9CKYVMWj6Z4QiivH-A1J9NFD52sQLapNEVqs6ZqXZyLeK/edit


## Use

```
function test_CheeRouter() {

    const htmlContent = getContentText_('https://en.wikipedia.org/wiki/List_of_nearest_known_black_holes')
    const chee = new CheeRouter_(htmlContent);

    console.log("Retrieved contents of 2-d parent of <h1>");
    chee.setNthParent(2, "h1");

    const dt = chee.get();

    const allTogater = dt.getTags("p,h1,h2,h3,h4,h5,h6,ul,ol,table", {add_html: true, starting_tag: "h1"});

    console.log(allTogater);

    const title = dt.getTitle();
    const meta = dt.getMeta();


}

/**
 * @param {String} url
 * 
 * @returns {String}
 */
function getContentText_(url) {
  const responce = UrlFetchApp.fetch(url, {muteHttpsExceptions: true});
  var htmlContent = responce.getContentText();
  return htmlContent;
}
```


### Notes

Loading cheerio with `loadCheerio()` to load functions in runtime. 
