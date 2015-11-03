/**
 * Module dependencies
 */

var lifecycle = require('./helpers/lcHelper.js');


// Set up "before all" and "after all"
before(lifecycle.setup);
after(lifecycle.teardown);
