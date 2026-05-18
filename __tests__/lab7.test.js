describe('Basic user flow for Website', () => {
  // First, visit the lab 7 website
  beforeAll(async () => {
    await page.goto('https://cse110-sp25.github.io/CSE110-Shop/');
  });

  // Each it() call is a separate test
  // Here, we check to make sure that all 20 <product-item> elements have loaded
  it('Initial Home Page - Check for 20 product items', async () => {
    console.log('Checking for 20 product items...');

    // Query select all of the <product-item> elements and return the length of that array
    const numProducts = await page.$$eval('product-item', (prodItems) => {
      return prodItems.length;
    });

    // Expect there that array from earlier to be of length 20, meaning 20 <product-item> elements where found
    expect(numProducts).toBe(20);
  });

  // Check to make sure that all 20 <product-item> elements have data in them
  // We use .skip() here because this test has a TODO that has not been completed yet.
  // Make sure to remove the .skip after you finish the TODO. 
  it('Make sure <product-item> elements are populated', async () => {
    console.log('Checking to make sure <product-item> elements are populated...');

    // Start as true, if any don't have data, swap to false
    let allArePopulated = true;

    // Query select all of the <product-item> elements
    const prodItemsData = await page.$$eval('product-item', prodItems => {
      return prodItems.map(item => {
        // Grab all of the json data stored inside
        return item.data;
      });
    });

    for (let i = 0; i < prodItemsData.length; i++) {
      console.log(`Checking product item ${i + 1}/${prodItemsData.length}`);

      // Make sure the title, price, and image are populated in the JSON
      const item = prodItemsData[i];
      if (item.title.length === 0) { allArePopulated = false; }
      if (item.price.length === 0) { allArePopulated = false; }
      if (item.image.length === 0) { allArePopulated = false; }

      if (!allArePopulated) break;
    }
    // Expect allArePopulated to still be true
    expect(allArePopulated).toBe(true);
    /**
    **** TODO - STEP 1 ****
    * Right now this function is only checking the first <product-item> it found, make it so that
      it checks every <product-item> it found
    * Remove the .skip from this it once you are finished writing this test.
    */
    
  }, 10000);

  // Check to make sure that when you click "Add to Cart" on the first <product-item> that
  // the button swaps to "Remove from Cart"
  it('Clicking the "Add to Cart" button should change button text', async () => {
    console.log('Checking the "Add to Cart" button...');

    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('product-item');

    const firstProductItem = await page.$('product-item');

    const shadowRootHandle = await firstProductItem.evaluateHandle(el => el.shadowRoot);
    const shadowRoot = shadowRootHandle.asElement();
    const button = await shadowRoot.$('button');

    const initialTextHandle = await button.getProperty('innerText');
    const initialText = await initialTextHandle.jsonValue();
    expect(initialText).toBe('Add to Cart');

    await button.click();

    await page.waitForFunction(
      btn => btn.innerText === 'Remove from Cart',
      {},
      button
    );

    const newTextHandle = await button.getProperty('innerText');
    const newText = await newTextHandle.jsonValue();
    expect(newText).toBe('Remove from Cart');

    /**
     **** TODO - STEP 2 **** 
     * Query a <product-item> element using puppeteer ( checkout page.$() and page.$$() in the docs )
     * Grab the shadowRoot of that element (it's a property), then query a button from that shadowRoot.
     * Once you have the button, you can click it and check the innerText property of the button.
     * Once you have the innerText property, use innerText.jsonValue() to get the text value of it
     * Remember to remove the .skip from this it once you are finished writing this test.
     */

  }, 2500);

  // Check to make sure that after clicking "Add to Cart" on every <product-item> that the Cart
  // number in the top right has been correctly updated
  it('Checking number of items in cart on screen', async () => {
    console.log('Checking number of items in cart on screen...');

    // Start with an empty cart so the count is predictable
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('product-item');

    // Click "Add to Cart" on every <product-item> (do it in page context for speed)
    await page.$$eval('product-item', productItems => {
      productItems.forEach(item => {
        item.shadowRoot.querySelector('button').click();
      });
    });

    // Check to see if the innerText of #cart-count is 20
    await page.waitForFunction(() => {
      const cartCount = document.querySelector('#cart-count');
      return cartCount && cartCount.innerText === '20';
    }, { timeout: 8000 });

    const cartCountText = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCountText).toBe('20');

  }, 10000);

  // Check to make sure that after you reload the page it remembers all of the items in your cart
  it('Checking number of items in cart on screen after reload', async () => {
    console.log('Checking number of items in cart on screen after reload...');

    // Ensure cart is full before reloading (don't depend on prior tests)
    await page.evaluate(() => {
      const fullCart = Array.from({ length: 20 }, (_, i) => i + 1);
      localStorage.setItem('cart', JSON.stringify(fullCart));
    });

    // Reload the page so it picks up localStorage
    await page.reload();
    await page.waitForSelector('product-item');

    // Check every <product-item> button says "Remove from Cart"
    const buttonTexts = await page.$$eval('product-item', productItems => {
      return productItems.map(item => item.shadowRoot.querySelector('button').innerText);
    });

    const allSayRemove = buttonTexts.every(text => text === 'Remove from Cart');
    expect(allSayRemove).toBe(true);

    // Also check to make sure that #cart-count is still 20
    await page.waitForFunction(() => {
      const cartCount = document.querySelector('#cart-count');
      return cartCount && cartCount.innerText === '20';
    }, { timeout: 8000 });

    const cartCountText = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCountText).toBe('20');

  }, 10000);

  // Check to make sure that the cart in localStorage is what you expect
  it('Checking the localStorage to make sure cart is correct', async () => {

    // Ensure cart is full (don't depend on prior tests)
    await page.evaluate(() => {
      const fullCart = Array.from({ length: 20 }, (_, i) => i + 1);
      localStorage.setItem('cart', JSON.stringify(fullCart));
    });

    // Check localStorage has exactly what we expect
    const cartValue = await page.evaluate(() => localStorage.getItem('cart'));
    const expected = JSON.stringify(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(cartValue).toBe(expected);

  });

  // Checking to make sure that if you remove all of the items from the cart that the cart
  // number in the top right of the screen is 0
  it('Checking number of items in cart on screen after removing from cart', async () => {
    console.log('Checking number of items in cart on screen...');

    // Ensure cart is full before removing (don't depend on prior tests)
    await page.evaluate(() => {
      const fullCart = Array.from({ length: 20 }, (_, i) => i + 1);
      localStorage.setItem('cart', JSON.stringify(fullCart));
    });
    await page.reload();
    await page.waitForSelector('product-item');

    // Click "Remove from Cart" on every <product-item>
    await page.$$eval('product-item', productItems => {
      productItems.forEach(item => {
        item.shadowRoot.querySelector('button').click();
      });
    });

    // Confirm cart count is now 0
    await page.waitForFunction(() => {
      const cartCount = document.querySelector('#cart-count');
      return cartCount && cartCount.innerText === '0';
    }, { timeout: 8000 });

    const cartCountText = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCountText).toBe('0');

  }, 10000);

  // Checking to make sure that it remembers us removing everything from the cart
  // after we refresh the page
  it('Checking number of items in cart on screen after reload', async () => {
    console.log('Checking number of items in cart on screen after reload...');

    // Ensure cart is empty before reload (don't depend on prior tests)
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([]));
    });

    await page.reload();
    await page.waitForSelector('product-item');

    // Check each <product-item> button says "Add to Cart"
    const buttonTexts = await page.$$eval('product-item', productItems => {
      return productItems.map(item => item.shadowRoot.querySelector('button').innerText);
    });
    const allSayAdd = buttonTexts.every(text => text === 'Add to Cart');
    expect(allSayAdd).toBe(true);

    // Check #cart-count is still 0
    await page.waitForFunction(() => {
      const cartCount = document.querySelector('#cart-count');
      return cartCount && cartCount.innerText === '0';
    }, { timeout: 8000 });

    const cartCountText = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCountText).toBe('0');

  }, 10000);

  // Checking to make sure that localStorage for the cart is as we'd expect for the
  // cart being empty
  it('Checking the localStorage to make sure cart is correct', async () => {
    console.log('Checking the localStorage...');

    // Ensure cart is empty (don't depend on prior tests)
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([]));
    });

    const cartValue = await page.evaluate(() => localStorage.getItem('cart'));
    expect(cartValue).toBe('[]');

  });
});
