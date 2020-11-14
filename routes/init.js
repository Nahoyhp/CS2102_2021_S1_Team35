const sql_query = require('../sql');
const passport = require('passport');
const bcrypt = require('bcrypt')

// Postgre SQL Connection
const { Pool } = require('pg');
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
  //ssl: true
});

const round = 10;
const salt  = bcrypt.genSaltSync(round);

function initRouter(app) {
	/* GET */
	app.get('/'      , index );
	app.get('/search', search);
	
	/* PROTECTED GET */
	app.get('/dashboard', passport.authMiddleware(), dashboard);
	app.get('/pets'    , passport.authMiddleware(), pets    );
	app.get('/availability'    , passport.authMiddleware(), availability    );
	app.get('/bids', passport.authMiddleware(), bids);
	
	app.get('/register' , passport.antiMiddleware(), register );
	app.get('/password' , passport.antiMiddleware(), retrieve );
	app.get('/records', passport.authMiddleware(), records);
	app.get('/services', passport.authMiddleware(), services);

	/* PROTECTED POST */
	app.post('/update_info', passport.authMiddleware(), update_info);
	app.post('/update_pass', passport.authMiddleware(), update_pass);
	app.post('/add_pet'   , passport.authMiddleware(), add_pet   );
	app.post('/add_availability'   , passport.authMiddleware(), add_availability);
	app.post('/add_services'	, passport.authMiddleware(), add_services);
	
	app.post('/reg_user'   , passport.antiMiddleware(), reg_user   );

	/* LOGIN */
	app.post('/login', passport.authenticate('local', {
		successRedirect: '/dashboard',
		failureRedirect: '/'
	}));
	
	/* LOGOUT */
	app.get('/logout', passport.authMiddleware(), logout);
}

function get_col(name, value, row) {
	i = name.indexOf(value);
	return i==-1?null:row[i];
}

// Render Function
async function basic(req, res, page, other) {
	var res1;
	var role = req.user.role;
	try{
		if (role=="petowner") {
			res1 = await pool.query(sql_query.query.user_info_po, [req.user.username]);
		} else if (role=="caretaker") {
			res1 = await pool.query(sql_query.query.user_info_ct, [req.user.username]);
		} else {
			res1 = await pool.query(sql_query.query.user_info, [req.user.username]);
		}
	} catch (err) {
		console.error("Error in retrieving info");
	}
	var names = res1.fields.map(field => field.name);
	var row = res1.rows[0];
	// console.log(res1.rows[0]);
	var info = {
		page: page,
		user: req.user.username,
		name: req.user.name,
		role : req.user.role,

		creditcard : row.credit_card==undefined?null:row.credit_card,
		currentrating : row.current_rating==undefined?null:row.current_rating,
		address : row.address==undefined?null:row.address,
		postalcode : row.postal_code==undefined?null:row.postal_code,
		petlimit : row.pet_limit==undefined	?null:row.pet_limit
	};
	if(other) {
		for(var fld in other) {
			info[fld] = other[fld];
		}
	}
	res.render(page, info);
}

function query(req, fld) {
	return req.query[fld] ? req.query[fld] : '';
}
function msg(req, fld, pass, fail) {
	var info = query(req, fld);
	return info ? (info=='pass' ? pass : fail) : '';
}

// GET
function index(req, res, next) {
	var ctx = 0, idx = 0, tbl, total;
	if(Object.keys(req.query).length > 0 && req.query.p) {
		idx = req.query.p-1;
	}
	pool.query(sql_query.query.page_lims, [idx*10], (err, data) => {
		if(err || !data.rows || data.rows.length == 0) {
			tbl = [];
		} else {
			tbl = data.rows;
		}
		pool.query(sql_query.query.ctx_games, (err, data) => {
			if(err || !data.rows || data.rows.length == 0) {
				ctx = 0;
			} else {
				ctx = data.rows[0].count;
			}
			total = ctx%10 == 0 ? ctx/10 : (ctx - (ctx%10))/10 + 1;
			console.log(idx*10, idx*10+10, total);
			if(!req.isAuthenticated()) {
				res.render('index', { page: '', auth: false, tbl: tbl, ctx: ctx, p: idx+1, t: total });
			} else {
				basic(req, res, 'index', { page: '', auth: true, tbl: tbl, ctx: ctx, p: idx+1, t: total });
			}
		});
	});
}
function search(req, res, next) {
	var ctx  = 0, avg = 0, tbl;
	var game = "%" + req.query.gamename.toLowerCase() + "%";
	pool.query(sql_query.query.search_game, [game], (err, data) => {
		if(err || !data.rows || data.rows.length == 0) {
			ctx = 0;
			tbl = [];
		} else {
			ctx = data.rows.length;
			tbl = data.rows;
		}
		if(!req.isAuthenticated()) {
			res.render('search', { page: 'search', auth: false, tbl: tbl, ctx: ctx });
		} else {
			basic(req, res, 'search', { page: 'search', auth: true, tbl: tbl, ctx: ctx });
		}
	});
}
function dashboard(req, res, next) {
	basic(req, res, 'dashboard', { info_msg: msg(req, 'info', 'Information updated successfully', 'Error in updating information'), pass_msg: msg(req, 'pass', 'Password updated successfully', 'Error in updating password'), auth: true });
}
function pets(req, res, next) {
	var ctx = 0, avg = 0, tbl;
	pool.query(sql_query.query.all_pets, [req.user.username], (err, data) => {
		if(err || !data.rows || data.rows.length == 0) {
			tbl = []
		} else {
			tbl = data.rows
		}
		basic(req, res, 'pets', {tbl: tbl, game_msg: msg(req, 'add', 'Pet added successfully', 'Pet does not exist'), auth: true });
	});
}
async function services(req, res, next) {
	var ct_tbl, all_tbl, email=req.user.username, role=req.user.role;
	const client = await pool.connect();

	try {
		await client.query('BEGIN')
		var ct_data, all_data;
		if (role=="pcsadmin") {
			ct_data = await client.query(sql_query.query.all_services);
		} else {
			ct_data = await client.query(sql_query.query.all_services_ct, [req.user.username]);
		}

		all_data = await client.query(sql_query.query.all_services_av);

		if(!ct_data.rows || ct_data.rows.length == 0 || !all_data.rows || all_data.rows.length == 0) {				
			ct_tbl=[]
			all_tbl=[]
		} else {
			ct_tbl = ct_data.rows;
			all_tbl = all_data.rows;
		}
		await client.query('COMMIT')
	} catch(err){
		await client.query('ROLLBACK')
		console.log(err)
		all_tbl=[]
		ct_tbl=[]
	} finally {
		client.release();
		basic(req, res, 'services', {all_tbl: all_tbl, ct_tbl:ct_tbl, game_msg: msg(req, 'add', 'Pet added successfully', 'Pet does not exist'), auth: true });
	}
}
function records(req, res, next) {
	var tbl, email=req.user.username, role = req.user.role;
	if (role=="pcsadmin") {
		pool.query(sql_query.query.all_records, (err, data) => {
			if(err || !data.rows || data.rows.length == 0) {
				tbl = []
			} else {
				tbl = data.rows
			}
			basic(req, res, 'records', {tbl: tbl, game_msg: msg(req, 'add', 'Pet added successfully', 'Pet does not exist'), auth: true });
		});
	} else {
		pool.query(sql_query.query.all_records_ct, [req.user.username], (err, data) => {
			if(err || !data.rows || data.rows.length == 0) {
				tbl = []
			} else {
				tbl = data.rows
			}
			basic(req, res, 'records', {tbl: tbl, game_msg: msg(req, 'add', 'Pet added successfully', 'Pet does not exist'), auth: true });
		});
	}
}
function availability(req, res, next) {
	var tbl, email=req.user.username;
	pool.query(sql_query.query.all_availability, [email], (err, data)=>{
		if(err || !data.rows || data.rows.length == 0) {
			tbl=[]
		} else {
			tbl = data.rows;
		}
		basic(req, res, 'availability', {tbl: tbl, play_msg: msg(req, 'add', 'Availability added successfully', 'Invalid parameter in availability'), auth: true });

	});
}

async function bids(req, res, next) {
	var bids_tbl, ct_tbl, email=req.user.username, role=req.user.role;
	const client = await pool.connect();

	try {
		await client.query('BEGIN')
		var bids_data;
		if(role=="petowner"){
			bids_data = await client.query(sql_query.query.all_bids_po, [email]);
		} else {
			bids_data = await client.query(sql_query.query.all_bids);
		}

		if(!bids_data.rows || bids_data.rows.length == 0) {				
			bids_tbl=[]
		} else {
			bids_tbl = bids_data.rows;
		}

		var ct_data;
		ct_data = await client.query(sql_query.query.all_ct);

		if(!ct_data.rows || ct_data.rows.length == 0) {				
			ct_tbl=[]
		} else {
			ct_tbl = ct_data.rows;
		}

		await client.query('COMMIT')
	} catch(err){
		await client.query('ROLLBACK')
		console.log(err)
		bids_tbl=[]
		ct_tbl=[]
	} finally {
		client.release();
		basic(req, res, 'bids', {bids_tbl: bids_tbl, ct_tbl:ct_tbl, play_msg: msg(req, 'add', 'Bid added successfully', 'Invalid parameter in bid'), auth: true });
	}
}

function register(req, res, next) {
	res.render('register', { page: 'register', auth: false });
}
function retrieve(req, res, next) {
	res.render('retrieve', { page: 'retrieve', auth: false });
}


// POST 
async function update_info(req, res, next) {
	// console.log(req.body);
	var role = req.user.role
	var username  = req.user.username;
	var name = req.body.name;
	var creditcard = req.body.creditcard;
	var address = req.body.address;
	var postalcode = req.body.postalcode;

	const client = await pool.connect();
	try {
		await client.query('BEGIN')
		await client.query(sql_query.query.update_info, [username, name]);
		if(role=="petowner" || role=="petowner-caretaker") {
			await client.query(sql_query.query.update_petowner_info, [username, creditcard, address, postalcode]);
		}
		
		if(role=="caretaker" || role=="petowner-caretaker") {
			await client.query(sql_query.query.update_caretaker_info, [username, address, postalcode]);
		}
		
		await client.query('COMMIT')
	} catch(err){
		await client.query('ROLLBACK')
		console.log(err)
		console.error("Error in update info");
		res.redirect('/dashboard?info=fail');
	} finally {
		client.release();
	}
	res.redirect('/dashboard?info=pass');
}
function update_pass(req, res, next) {
	var username = req.user.username;
	var password = bcrypt.hashSync(req.body.password, salt);
	pool.query(sql_query.query.update_pass, [username, password], (err, data) => {
		if(err) {
			console.error("Error in update pass");
			res.redirect('/dashboard?pass=fail');
		} else {
			res.redirect('/dashboard?pass=pass');
		}
	});
}

async function add_services(req, res, next) {
	var email = req.user.username;
	var category = req.body.category
	var baseprice = req.body.baseprice
	var price = req.body.price

	const client = await pool.connect();
	try {
		await client.query('BEGIN')
		await client.query(sql_query.query.add_services, [category, baseprice]);
		await client.query(sql_query.query.add_provides, [email, category, price]);
		
		await client.query('COMMIT')
	} catch(err){
		await client.query('ROLLBACK')
		console.log(err)
		console.error("Error in adding service");
		res.redirect('/services?info=fail');
	} finally {
		client.release();
	}
	res.redirect('/services?info=pass');
}

function add_pet(req, res, next) {
	var username = req.user.username;
	var petname = req.body.petname;
	var category = req.body.category;
	var specialneeds = req.body.specialneeds;

	pool.query(sql_query.query.add_pet, [username, petname, category, specialneeds], (err, data) => {
		if(err) {
			console.error("Error in adding pet");
			res.redirect('/pets?add=fail');
		} else {
			res.redirect('/pets?add=pass');
		}
	});
}
function add_availability(req, res, next) {
	var username = req.user.username;
	var from  = req.body.from;
	var to = req.body.to;

	pool.query(sql_query.query.add_availability, [username, from ,to], (err, data) => {
		if(err) {
			console.log(err)
			console.error("Error in adding availability");
			res.redirect('/availability?add=fail');
		} else {
			res.redirect('/availability?add=pass');
		}
	});
}

async function reg_user(req, res, next) {
	var username  = req.body.username;
	var password  = bcrypt.hashSync(req.body.password, salt);
	var name = req.body.name;
	var role  = req.body.role;
	const client = await pool.connect()

	try {
		await client.query('BEGIN')
		const res1 = await client.query(sql_query.query.add_user, [username,password,name,role]);
		// If no error add info into respective groups
		if (role == 'petowner' || role == 'petowner-caretaker') {
			var creditcard = req.body.creditcard;
			var address = req.body.address;
			var postalcode = req.body.postalcode;

			const res2 = await client.query(sql_query.query.add_petowner, [username,creditcard,address,postalcode]);
		}
		if (role == 'caretaker' || role == 'petowner-caretaker') {
			var address = req.body.address;
			var postalcode = req.body.postalcode;
			var status = req.body.status
			const res3 = await client.query(sql_query.query.add_caretaker, [username,address,postalcode]);
			if (status == "fulltimer") {
				await client.query(sql_query.query.add_fulltimer, [username]);
			} else {
				await client.query(sql_query.query.add_parttimer, [username, 2]);
			}
			
		}
		await client.query('COMMIT')
	} catch (err) {
		await client.query('ROLLBACK')		
		console.error("Error in adding user", err);
		res.redirect('/register?reg=fail');			
	} finally {
		client.release();
	}
	
	await req.login({
				username    : username,
				passwordHash: password,
				name   : name,
				role    : role,
			}, function(err) {
				if(err) {
					return res.redirect('/register?reg=fail');
				} else {
					return res.redirect('/dashboard');
				}
			});	
}


// LOGOUT
function logout(req, res, next) {
	req.session.destroy()
	req.logout()
	res.redirect('/')
}

module.exports = initRouter;