(function () {


	// -- Settings
	var map = [],
	populationSize = 100,
	killingRate = populationSize/2,
	generations = 100,
	mutationRate = 50;


	// -- Html element getter functions

	function getCanvas () {
		return document.getElementById("points-plot");
	}

	function getStartBtn () {
		return document.getElementById("run-btn");
	}

	function getTicksCountContainer () {
		return document.getElementById("ticks-count");
	}

	function getRankContainer () {
		return document.getElementById("rank");
	}

	function getCtx (canvas) {
		return canvas.getContext('2d');
	}

	function getFeedbackContainer () {
		return document.getElementById('feedback');
	}

	function giveFeedback (text, positive) {
		var feedCont = getFeedbackContainer();

		feedCont.innerText = text;
		if (positive) {
			feedCont.style.color = '#00FF00';
		} else {
			feedCont.style.color = '#FF0000';
		}
	}

	function resetFeedback () {
		getFeedbackContainer().innerText = '';
	}


	// -- Drawing functions

	function drawPoint (ctx, point) {
		ctx.beginPath();
		ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
		ctx.fill();
	}

	function drawVert (ctx, point1, point2) {
		ctx.beginPath();
		ctx.moveTo(point1.x,point1.y);
		ctx.lineTo(point2.x, point2.y);
		ctx.stroke();
	}

	function drawGraph (ctx, points) {
		points.forEach(function (p, i) {
			if (points[i + 1]) {
				drawVert(ctx, p, points[i+1]);
			} else {
				drawVert(ctx, p, points[0]);
			}
		});
	}

	function generateNewPoint (ctx, x, y) {
		var point = {x: x, y: y};

		drawPoint(ctx, point);

		return point;
	}

	// -- GA functions

	function removeDuplicates (arIn) {
		var arOut = [];

		arIn.forEach(function (el, key) {
			var found = false;
			arOut.some(function (innerEl, innerKey) {
				if (el.x === innerEl.x && el.y === innerEl.y) {
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

	function deepClone (obj) {
		obj = JSON.parse(JSON.stringify(obj));
		return obj;
	}

	function generatePopulation (points) {
		var population = [],
			i;

		for (i = 0; i < populationSize; i++) {
			population.push(generateChromosome(points));
		}

		return population;
	}

	function calcDistance (p1, p2) {
		return Math.round(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
	}

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

	function checkPointsAreEqual (point1, point2) {
		return (point1.x === point2.x && point1.y === point2.y);
	}

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

	function rankingToPopulation (ranking) {
		var pop = [];
		ranking.forEach(function (rk) {
			pop.push(rk.chromosome);
		});

		return pop;
	}

	function doMutation (chr) {
			if (Math.floor(Math.random() * 100) <= mutationRate) {
				chr = mutate(chr);
			}
		return chr;
	}

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