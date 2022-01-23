// --- objects --- //
class Objects {
	constructor() {
	}
	vaccine(x, y, vaccine_image) {
		this.x = x;
		this.y = y;
		this.width = 36;
		this.height = 33;
		this.vaccine_image = vaccine_image;
		this.vaccine_image.src = "images/vaccine.png";
		return this;
	}
	bullet(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}
	virus(x, y, line, column, virus_image, level) {
		this.x = x;
		this.y = y;
		this.line = line;
		this.column = column;
		this.width = 32;
		this.height = 24;
		this.virus_image = virus_image;
		this.level = level;
		//even-odd level selector		 
		this.virus_image.src = (this.level % 2 == 0) ? "images/virus2.png" : "images/virus.png";
		return this;
	}
	bomb(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}
}
;




