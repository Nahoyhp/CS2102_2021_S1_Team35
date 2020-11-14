const sql = {}

sql.query = {
	// Counting & Average
	count_play: 'SELECT COUNT(winner) FROM game_plays WHERE user1=$1 OR user2=$1',
	count_wins: 'SELECT COUNT(winner) FROM game_plays WHERE winner=$1',
	avg_rating: 'SELECT AVG(rating) FROM user_games INNER JOIN game_list ON user_games.gamename=game_list.gamename WHERE username=$1',
	
	// Information
	page_game: 'SELECT * FROM game_list WHERE ranking >= $1 AND ranking <= $2 ORDER BY ranking ASC',
	page_lims: 'SELECT * FROM game_list ORDER BY ranking ASC LIMIT 10 OFFSET $1',
	ctx_games: 'SELECT COUNT(*) FROM game_list',
	all_pets: 'SELECT * FROM ownedpets WHERE email = $1',
	all_availability: 'SELECT * from availability WHERE email=$1',
	all_bids_po: 'SELECT * FROM bids where oemail=$1',
	all_bids: 'SELECT * FROM bids',
	all_ct: 'SELECT * FROM caretakers',
	all_records_ct: 'SELECT * FROM records WHERE email=$1',
	all_records: 'SELECT * FROM records',
	all_services: 'SELECT * FROM services NATURAL JOIN provides',
	all_services_ct: 'SELECT * FROM services NATURAL JOIN provides WHERE email=$1',
	all_services_av: 'SELECT * FROM services',
	user_info: 'SELECT * FROM (users natural left join petowners) natural left join caretakers where email=$1',
	user_info_po: 'SELECT * FROM users natural left join petowners where email=$1',
	user_info_ct: 'SELECT * FROM users natural left join caretakers natural left join parttimers where email=$1',

	// Insertion
	add_pet: 'INSERT INTO ownedpets (name, email, category, special_needs) VALUES($2, $1, $3, $4)',
	add_availability: 'insert into availability (email, available_daterange) values ($1, daterange($2, $3))',
	add_petowner: 'INSERT INTO petowners (email, credit_card, address, postal_code) VALUES ($1,$2,$3,$4)',
	add_caretaker: 'INSERT INTO caretakers (email, current_rating, address, postal_code) VALUES ($1,1,$2,$3)',
	add_user: 'INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,$4)',
	add_fulltimer: 'insert into fulltimers (email) values ($1)',
	add_parttimer: 'insert into parttimers (email, pet_limit) values ($1, $2)',
	add_services: 'insert into services (category, base_price) values ($1, $2)',
	add_provides: 'insert into provides (email, category, price) values ($1, $2, $3)',
	// Login
	userpass: 'SELECT * FROM users WHERE email=$1',
	
	// Update
	update_info: 'UPDATE users SET name=$2 WHERE email=$1',
	update_petowner_info: 'UPDATE petowners SET credit_card=$2, address=$3, postal_code=$4 WHERE email=$1',
	update_caretaker_info: 'UPDATE caretakers SET address=$2, postal_code=$3 WHERE email=$1',
	update_pass: 'UPDATE users SET password=$2 WHERE email=$1',
	
	// Search
	search_game: 'SELECT * FROM game_list WHERE lower(gamename) LIKE $1',
}

module.exports = sql