require("dotenv").config({path:"../.env"}); //go to previous dir and scan the env file
const { createClient } = require('@supabase/supabase-js');
const key = process.env.SUPABASE_KEY;
const url = process.env.SUPABASE_URL;
const supabase = createClient(url, key)

module.exports = supabase; //Pipeline or middleman to all other files

//git fetch, to get any new changes, git pull to pull the files