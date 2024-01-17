/**
 * @param {string} html
 */
function CheeRouter(html) {
  if (!html || !(typeof html === 'string')) {
    throw new Error("CheeRouter requires HTML-string parameter");
  }

  const self = this;

  /**
   * @method
   * @returns {CheeElement}
   */
  self.get = function() {
    return self.$;
  }

  /** 
   * @method
   * @param {string} html 
   */
  self.set = function(html) {
    self.html = html;
    self.$ = new CheeElement(html);
  }

  /**
   * @method
   * @param {number} n
   * @param {string} tag
   * 
   * @return {Cheerio}
   */
  self.setNthParent = function(n, tag) {
    let $parent = self.get().find(tag);
    let nextParent = null;
    for (let i = 0; i < n; i++) {
      nextParent = $parent.parent();
      if (nextParent && nextParent[0]) {
        $parent = nextParent;
      } else {
         self.$.set($parent);
         return;
      }
    }
    console.log($parent);
    self.$.set($parent);
  }

  self.set(html);
  
}

/**
 * @param {String} [html]
 * @param {Cheerio} [element]
 */
function CheeElement(html) {
  const self = this;
  _invoke();
  if (html) {
    self.me = loadCheerio(html);
    self.$ = self.me;
  }

  self.set = function(element) {
    self.me = element;
  }


  /** @method */
  self.getText = (elt) => {
    elt = elt || self.me;
    let output = "";
    if (elt.text) {
      output = elt.text();
    } else {
      output = self.$(elt).text();
    }
    return _cleanText(output);
  }
  /**  @method */
  self.find = (text) => {
    if (typeof self.me === "function") return self.me(text);
    return self.me.find(text);
  }

  /**
   * @method
   * @return {Object[]}
   */
  self.getMeta = function() {
    const result = [];
    const elements = self.$('meta');
    if (!elements) {
      console.log("No meta description found.")
      return [];
    }
    elements.each((index, element) => {
      result.push(self.me(element).attr());
    });
    return result;
  }

  /**
   * @method
   * @param {String} propName
   * @param {Boolean} [checkIncludes]
   * 
   * @returns {String}
   */
  self.getMetaProperty = function(propName, checkIncludes = false) {
    const meta = self.getMeta();
    if (!meta) return "";
    if (!meta.length) return "";
    let elt = meta.find(elt => {
      for (let k in elt) {
        if(elt[k] === propName) return true;
      }
      return false;
    });
    if (!elt) {
      if (!checkIncludes) return "";
      elt = meta.find(elt => {
        for (let k in elt) {
          if (elt[k].includes(propName)) return true;
        }
        return false;
      });
    }
    /** @param {String} tagValue
     * @returns {Boolean}
     */
    function _shouldIncludeTag(tagValue) {
      if (tagValue === propName) return false;
      if (typeof tagValue !== "string") return false;
      if (["true", "false"].indexOf(tagValue) !== -1) return false;
      if (checkIncludes && tagValue.includes(propName)) return false;
      return true;
    }
    if (!elt) return "";
    let resultElements = [];
    for (let k in elt) {
      if (_shouldIncludeTag(elt[k])) {
        resultElements.push(elt[k]);
      }
    }
    return resultElements.join(" ");
  }

  /**
   * @returns {String}
   */
  self.getTitle = function() {
    const title = self.$("title");
    return self.getText(title);
  }


  /**
   * @typedef {Object} CheeGetTagsOptions
   * @prop {Boolean} add_html
   * @prop {String} starting_tag
   */

  /**
   * @method
   * @param {String} toFind - comma separated
   * @param {CheeGetTagsOptions} [options]
   * 
   * @return {string}
   */
  self.getTags = function(toFind, options = {}) {
    const elements = self.find(toFind);
    let toContinueLoop = false;
    if (!elements) {
      console.log("Did not find elements: " + toFind);
      return "";
    }
    let resultParts = [];

    const elementsParseMap = {
      "p": { func: _getSimpleElement },
      "h1": { func: _getSimpleElement },
      "h2": { func: _getSimpleElement },
      "h3": { func: _getSimpleElement },
      "h4": { func: _getSimpleElement },
      "h5": { func: _getSimpleElement },
      "h6": { func: _getSimpleElement },
      "ul": { func: _getList },
      "ol": { func: _getList },
      "a": { func: _getLink },
      "table": { func: _getTable },
    }

    /**
     * @param {Cheerio} elt
     * @returns {String}
     */
    function _getTable(elt) {
      const table = self.$(elt);
      let result = [];
      let resultRow = [];
      table.find('tr').each((rowIndex, rowElement) => {
          const row = self.$(rowElement).find('th,td').map((cellIndex, cellElement) => {
            const cell = self.$(cellElement);
            const tagName = cell[0].tagName;
            let text = cell.text();
            if (text === "") text = cell.attr("title");
            if (!text) text = "";
            if (options.add_html) {
              text = "<" + tagName + ">" + text + "</" + tagName + ">";
            }
            text = _cleanText(text);
            resultRow.push(text);
          });
          result.push(resultRow);
          resultRow = [];
      });
      let elementDevider = "\t";
      if (options.add_html) {
        elementDevider = "";
      }
      let textResult = result.map((row) => {
        let elements = row.join(elementDevider);
        if (options.add_html) {
          elements = "<tr>" + elements + "</tr>";
        }
        return elements;
      }).join("\n");
      if (options.add_html) {
        textResult = ["<table", textResult, "</table>"].join("\n");
      }
      return textResult;
    }

    /**
     * @param {Cheerio} elt
     * @returns {String}
     */
    function _getLink(elt) {
      let href = self.$(elt).attr('href');
      if (!options.add_html) return href;
      return "<a href='" + href + "'>" + self.getText(elt) + "</a>";
    }

    /**
     * @param {Cheerio} elt
     * @param {String} tagName
     * @returns {String}
     */
    function _getList(elt, tagName) {
      let lis = [], li;
      if (options.add_html) {
        lis.push("<" + tagName + ">");
      }
      const listItems = self.$(elt).find("li");
      if (!listItems || listItems.length === 0) return "";
      let countItems = 0;
      listItems.each ((index, element) => {
        li = self.getText(element);
        if (options.add_html) {
          li = "<li>" + li + "</li>";
        } else if (tagName === "ol") {
          li =(index + 1) + ". " + li;
        }
        lis.push(li);
        countItems++;
      });
      if (countItems === 0) return "";
      if (options.add_html) {
        lis.push("</" + tagName + ">");
      }
      return lis.join("\n");
    }
    
    /**
     * @prop {Cheerio} elt
     * @prop {String} tagName
     * @returns {String}
     */
    function _getSimpleElement(elt, tagName) {
      let start = "", end = "";
      if (options.add_html) {
        start = "<" + tagName + ">";
        end = "</" + tagName + ">";
      }
      return start + self.getText(elt) + end;
    }
    /** @prop {String} tagName} */
    function _testStartingTag(tagName) {
      if (!options.starting_tag) return true;
      if (options.starting_tag === "") return true;
      if (options.starting_tag === tagName) {
        toContinueLoop = true;
        return true;
      }
      if (toContinueLoop) return true;
      return false;
    }

    let tagName, opts, subResult;
    elements.each ((index, element) => {
      tagName = self.$(element)[0].tagName;
      if (!_testStartingTag(tagName)) return;
      opts = elementsParseMap[tagName];
      if (!opts) return;
      subResult = opts.func(element, tagName);
      if (subResult !== "") resultParts.push(subResult);
    });

    return resultParts.join("\n");
  }

  /**
   * @param {String} text
   * 
   * @returns {String}
   */
  function _cleanText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function _invoke() {
    if (typeof loadCheerio === "undefined") {
      const t = new Date();
      invokeCheerio();
      return;
    }
  }
  
}
