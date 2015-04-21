(function () {


	// ---------------------------------
	// ----------- Settings ------------
	// ---------------------------------
	var map = [],
	populationSize = 100,
	killingRate = populationSize/2,
	generations = 100,
	mutationRate = 50;

	// ---------------------------------
	// -- Html manipulation functions --
	// ---------------------------------

	/**
	 * Get the canvas element used to display the plot
	 *
	 * @returns {Element}
	 */
	function getCanvas () {
		return document.getElementById("points-plot");
	}

	/**
	 * Get the start button
	 *
	 * @returns {Element}
	 */
	function getStartBtn () {
		return document.getElementById("run-btn");
	}

	/**
	 * Get the html container used to display the actual tick
	 *
	 * @returns {Element}
	 */
	function getTicksCountContainer () {
		return document.getElementById("ticks-count");
	}

	/**
	 * Get the html container used to display the actual best rank
	 *
	 * @returns {Element}
	 */
	function getRankContainer () {
		return document.getElementById("rank");
	}

	/**
	 * Get the 2d context from a canvas element
	 *
	 * @param canvas {Element] The canvas html element
	 * @returns {CanvasRenderingContext2D}
	 */
	function getCtx (canvas) {
		return canvas.getContext('2d');
	}

	/**
	 * Get the html contanier used to display feedback and error
	 *
	 * @returns {Element}
	 */
	function getFeedbackContainer () {
		return document.getElementById('feedback');
	}

	/**
	 * Display and set the color for a feedback message
	 *
	 * @param text {String} The message
	 * @param positive {Boolean} True if a positive feedback, otherwise false
	 */
	function giveFeedback (text, positive) {
		var feedCont = getFeedbackContainer();

		feedCont.innerText = text;
		if (positive) {
			feedCont.style.color = '#00FF00';
		} else {
			feedCont.style.color = '#FF0000';
		}
	}

	/**
	 * Reset the content of the feedback container
	 *
	 */
	function resetFeedback () {
		getFeedbackContainer().innerText = '';
	}

	// ---------------------------------
	// ------ Drawing functions --------
	// ---------------------------------

	/**
	 * Draw a point on a canvas
	 *
	 * @param ctx {2dContext} The context used
	 * @param point {object} The data of the point to draw {x, y}
	 */
	function drawPoint (ctx, point) {
		ctx.beginPath();
		ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
		ctx.fill();
	}

	/**
	 * Draw a line between two points
	 *
	 * @param ctx {2dContext} The context used
	 * @param point1 {object} The data of the starting point
	 * @param point2 {object} The data of the ending point
	 */
	function drawVert (ctx, point1, point2) {
		ctx.beginPath();
		ctx.moveTo(point1.x,point1.y);
		ctx.lineTo(point2.x, point2.y);
		ctx.stroke();
	}

	/**
	 * Plot all the points and all the vertexes between them
	 *
	 * @param ctx {2dContext} The context used
	 * @param points {Array} The points array
	 */
	function drawGraph (ctx, points) {
		points.forEach(function (p, i) {
			if (points[i + 1]) {
				drawVert(ctx, p, points[i+1]);
			} else {
				drawVert(ctx, p, points[0]);
			}
		});
	}

	/**
	 * Add a new point to the plot
	 *
	 * @param ctx {2dContext} The context used
	 * @param x {Number} The x coordinate of the point
	 * @param y {Number} The y coordinate of the point
	 * @returns {{x: *, y: *}}
	 */
	function generateNewPoint (ctx, x, y) {
		var point = {x: x, y: y};

		drawPoint(ctx, point);

		return point;
	}

	// -- GA functions

	/**
	 * Remove duplicated points the starting points array
	 *
	 * @param arIn {Array} The starting points array
	 * @returns {Array} The array without duplicates
	 */
	function removeDuplicates (arIn) {
		var arOut = [];

		arIn.forEach(function (el, key) {
			var found = false;
			arOut.some(function (innerEl, innerKey) {
				if (checkPointsAreEqual(el, InnerEl)) {
					found = true;
					return true;
				}
			});

			if (!found) {
				arOut.push(el);
			}
		});

		return arOut;
	}

	/**
	 * Create a deep clone of an object
	 *
	 * @param obj {object} The object to clone
	 * @returns {object} The cloned object
	 */
	function deepClone (obj) {
		obj = JSON.parse(JSON.stringify(obj));
		return obj;
	}

	/**
	 * Calculate the distance between two points
	 *
	 * @param p1 {object} The starting point
	 * @param p2 {object} The ending point
	 * @returns {number} The distance
	 */
	function calcDistance (p1, p2) {
		return Math.round(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
	}

	/**
	 * Check if two points have the same coordinates
	 * @param point1 {object} The first point to check
	 * @param point2 {object} The second point to check
	 * @returns {boolean} True if both have the same coordinates, false otherwise
	 */
	function checkPointsAreEqual (point1, point2) {
		return (point1.x === point2.x && point1.y === point2.y);
	}

	/**
	 * Generate a chromosome by generating a randomly ordered array of points
	 *
	 * @param points {Array} The starting points list
	 * @returns {Array} The chromosome generated
	 */
	function generateChromosome (points) {
		var len = points.length,
			chromo = [],
			newPoints,
			rand,
			i;

		newPoints = deepClone(points);

		for (i = 0; i < len; i++) {
			rand = Math.floor(Math.random() * newPoints.length);
			chromo.push(newPoints.splice(rand, 1)[0]);
		}

		return chromo;
	}

	/**
	 *  Generate a list of chromosome to use as population
	 *
	 * @param points {Array} The starting points list
	 * @returns {Array} The population of chromosomes
	 */
	function generatePopulation (points) {
		var population = [], i;

		for (i = 0; i < populationSize; i++) {
			population.push(generateChromosome(points));
		}

		return population;
	}

	/**
	 * Assign a value to a chromosome, based on the sum of distances between all the points
	 *
	 * @param chromosome {Array} The chromosome
	 * @returns {Number} The chromosome's value
	 */
	function calcValue (chromosome) {
		var trv = chromosome.reduce(function(dist, curr, index){
				if (index > 0) {
					return dist + calcDistance(curr, chromosome[index-1]);
				} else {
					return 0;
				}
			}, 0);

		trv += calcDistance(chromosome[chromosome.length - 1], chromosome[0]);

		return trv;
	}

	/**
	 * Check if chromosome's elements are unique
	 *
	 * @param chromosome The chromosome to check
	 * @returns {boolean} True if is valid, false otherwise
	 */
	function checkChromosomeIsValid (chromosome) {
		var fFound = false;
		chromosome.some(function (ck, key) {
			var found = false;

			chromosome.some(function (el, k) {
				if (k !== key && checkPointsAreEqual(el, ck)) {
					found = true;
					return true;
				}
			});

			if(found === true) {
				fFound = true;
				return true;
			}
		});

		return !fFound;
	}

	/**
	 * Generate a new chromosome from other two chromosomes
	 *
	 * @param pop1 {object} First parent
	 * @param pop2 {object} Second parent
	 * @returns {*} False if the new chromosome is not valid, a chromosome otherwise
	 */
	function crossover (pop1, pop2) {
		var pivot = Math.floor(Math.random() * pop1.length),
			child = [],
			len = pop1.length,
			clonedPop1 = deepClone(pop1),
			i;

		child.push.apply(child, clonedPop1.splice(0, pivot));

		pop2.forEach(function (el) {

			clonedPop1.forEach(function (p) {
				if (checkPointsAreEqual(p, el)) {
					child.push(p);
				}
			});
		});

		if (checkChromosomeIsValid(child)){
			return child;
		} else {
			return false;
		}
	}

	/**
	 * Generate a sorted list with a rank for every chromosome in a population
	 *
	 * @param population The starting population
	 * @returns {Array} The sorted ranking
	 */
	function makeRanking (population) {
		var ranking = [];

		population.forEach(function (pop) {
			ranking.push({
				chromosome: deepClone(pop),
				rank: calcValue(pop)
			});
		});

		ranking.sort(function (a, b) {
			return b.rank - a.rank;
		});

		return ranking;
	}

	/**
	 * Generate a population starting from a ranking
	 *
	 * @param ranking {Array} The starting ranking
	 * @returns {Array} The population generated
	 */
	function rankingToPopulation (ranking) {
		var pop = [];
		ranking.forEach(function (rk) {
			pop.push(rk.chromosome);
		});

		return pop;
	}

	/**
	 * Randomly apply a mutation to a chromosome
	 *
	 * @param chr The starting chromosome
	 * @returns {*} The chromosome, mutated or not
	 */
	function doMutation (chr) {
			if (Math.floor(Math.random() * 100) <= mutationRate) {
				chr = mutate(chr);
			}
		return chr;
	}

	/**
	 * Randomly changes position of chromosome point
	 *
	 * @param chromosome {Array} The starting chromosome
	 * @returns {Array} THe mutated chromosome
	 */
	function mutate (chromosome) {
		var gene = chromosome.splice(Math.floor(Math.random() * chromosome.length), 1)[0];

		chromosome.splice(Math.floor(Math.random() * chromosome.length), 0, gene);

		return chromosome;
	}


	function makeNewGeneration (population) {
		var ranking = makeRanking(population),
			len = ranking.length,
			newGen = [],
			parentPool,
			parent1,
			parent2,
			child,
			i;

		ranking.splice(0, killingRate);

		ranking = rankingToPopulation(ranking);

		newGen.push.apply(newGen, ranking);

		for (i = 0; i < len - ranking.length; i++) {
			parentPool = deepClone(ranking);
			parent1 = parentPool.splice(Math.floor(Math.random() * parentPool.length), 1)[0];
			parent2 = parentPool.splice(Math.floor(Math.random() * parentPool.length), 1)[0];
			child = crossover(parent1, parent2);

			child = doMutation(child);

			if (child) {
				newGen.push(child);
			}
		}

		return newGen;
	}

	function triggerNewGen (ticks, population, cb, tickContainer, rankContainer) {
		setTimeout(function () {
			var newPopulation,
				winnerSolution;
			ticks = ticks - 1;

			newPopulation = makeNewGeneration(population);

			if (ticks > 0) {
				winnerSolution = makeRanking(newPopulation)[newPopulation.length-1];

				if (tickContainer) {
					tickContainer.innerText = ticks;
				}

				if (rankContainer) {
					rankContainer.innerText = winnerSolution.rank;
				}
				triggerNewGen(ticks, newPopulation, cb, tickContainer, rankContainer);
			} else {
				winnerSolution = makeRanking(newPopulation)[newPopulation.length-1];
				cb(winnerSolution.chromosome);
			}

		}, 10);
	}

	function init () {
		var button = getStartBtn(),
			canvas = getCanvas(),
			tickContainer = getTicksCountContainer(),
			rankContainer = getRankContainer(),
			ctx = getCtx(canvas),
			running = false,
			population;


		canvas.addEventListener('click', function(event){
			var x = event.pageX - canvas.offsetLeft,
				y = event.pageY - canvas.offsetTop;

			if (!running) {
				map.push(generateNewPoint(ctx, x, y));
			}

			return false;
		});


		button.addEventListener('click', function (event) {
			var cleanMap = removeDuplicates(map);

			if (cleanMap.length < 2){
				giveFeedback('Please add more points ', false);
			} else if (!running) {
				resetFeedback();

				ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );

				cleanMap.forEach(function (point) {
					drawPoint(ctx, point);
				});

				population = generatePopulation(cleanMap);

				running = true;
				triggerNewGen(generations, population, function (res) {
					running = false;
					drawGraph(ctx, res);
				}, tickContainer, rankContainer);
			}

			return false;
		});
	}

	// -- Let's start
	init();

} ());