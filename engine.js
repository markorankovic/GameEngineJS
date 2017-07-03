
/* To continue with this project, the following will need to be done:

	1. Go to the Physics class and fix the issue by the comment "Error here"
	2. Ensure the velocityX doesn't interfere with the falling of the circle
	3. Introduce inertia, that is the ball will have angular acceleration

*/


class Shape extends Path2D {
	
	constructor(lineWidth, fillColor, strokeColor) {
		super();
		this.path = new Path2D();
		this.lineWidth = lineWidth;
		this.fillColor = fillColor;
		this.strokeColor = strokeColor;
		this.physicsActive = false;
		this.type;
	}

	getScene(node) {
		if (!node.parent) {
			return node;
		}
		return this.getScene(node.parent);
	}

	boundingBoxFullyIn(node, target) {
		let onlyWithinXAxis = target.xPos < node.xPos && node.xPos+this.width < target.xPos+target.shape.width;
		let onlyWithinYAxis = target.yPos < node.yPos+this.height && target.yPos+target.shape.height > node.yPos;
		if (onlyWithinXAxis && onlyWithinYAxis) {
			return true;
		}
		return false;
	}

	translateCentre(node, target) {
		let centreX = node.xPos + node.shape.width/2;
		let centreY = node.yPos + node.shape.height/2;
		let tCentreX = target.xPos + target.shape.width/2;
		let tCentreY = target.yPos + target.shape.height/2;

		let radius = Math.hypot(centreX-tCentreX, tCentreY-centreY);
		let theta = Math.atan2((centreY-tCentreY),(centreX-tCentreX)) - target.theta;

		centreX = tCentreX + radius * Math.cos(theta);
		centreY = tCentreY + radius * Math.sin(theta);
		return [centreX, centreY];
	}

	isHit(node, scene) {

	}

	create(node, ctx) {

	}

}

class Curve extends Shape {

	constructor (lineWidth, fillColor, strokeColor) {
		super(lineWidth, fillColor, strokeColor);
	}

		isHit(node, scene, ctx) {
		for (var i = 0; i < scene.children.length; i++) {
			if (!(scene.children[i].shape.fillColor == this.fillColor)) {
			var child = scene.children[i];
			if (child.children.length > 0) {
				this.isHit(node, child, ctx);
			}
			for (var row = 0; row < node.shape.height; row++) {
				for (var col = 0; col < node.shape.width; col++) {
					if (ctx.isPointInPath(child.shape.path, node.xPos+col, node.yPos+row)) {
						console.log('Collision detected!');
					}
				}
			}
		}
		}
	}

}

class Circle extends Shape { 

	constructor(radius, lineWidth, fillColor, strokeColor) {
		super(lineWidth, fillColor, strokeColor);
		this.radius = radius;
		this.width = radius*2;
		this.height = radius*2;
		this.type = 'circle';
		this.target;
	}

	getTranslatedPositionsAndVelocities(node, target) {
		let r = this.radius;
		let x = node.xPos+r;
		let y = node.yPos+r;
		let speed = Math.hypot(node.physicsBody.velocityY, node.physicsBody.velocityX);
		let a = Math.atan2(node.physicsBody.velocityY, node.physicsBody.velocityX) - target.theta;
		
		let p = this.translateCentre(node, target);
		let newX = p[0];
		let newY = p[1];
		let vX = speed*Math.cos(a);
		let vY = speed*Math.sin(a);
		return [newX, newY, vX, vY]; 
	}

	getPointOfCollisionForCircleAroundCorner(node, target, corner) {

		if (node.physicsBody.velocityX == 0 && node.physicsBody.velocityY == 0) {
			return [NaN, NaN];
		}
		let r = this.radius;
		let translatedPositionsAndVelocities = this.getTranslatedPositionsAndVelocities(node, target);
		
		let velocityY = translatedPositionsAndVelocities[3];
		let velocityX = translatedPositionsAndVelocities[2];

		// target properties
		let tX = corner[0];
		let tY = corner[1];

		// node properties
		let cX = translatedPositionsAndVelocities[0]-tX;
		let cY = translatedPositionsAndVelocities[1]-tY;
		let vX = velocityX;
		let vY = velocityY;
		let dir = Math.atan2(vY, vX);

		// Wolfram's algorithm

		// Points in between for which a line may intersect a circle 
		let x1 = cX;
		let y1 = cY;

		let x2 = cX + 1000*Math.cos(dir);
		let y2 = cY + 1000*Math.sin(dir);

		let dx = x2 - x1;
		let dy = y2 - y1;
		let dr = Math.hypot(dx, dy); 
		let D = x1*y2 - x2*y1;
		let discriminant = Math.round((r*r*dr*dr) - (D*D));

		// Collision point
		let x = (D*dy - dx * Math.sqrt(discriminant)) / (dr*dr) + tX;
		let y = (-D*dx - dy*Math.sqrt(discriminant)) / (dr*dr) + tY;

		let radius = Math.hypot(x-(target.xPos+target.shape.width/2), y-(target.yPos+target.shape.height/2));
		let theta = Math.atan2((y-(target.yPos+target.shape.height/2)),(x-(target.xPos+target.shape.width/2))) + target.theta;
	
		// Translate back
		x = target.xPos+target.shape.width/2 + radius * Math.cos(theta);
		y = target.yPos+target.shape.height/2 + radius * Math.sin(theta);

		// Check if direction of the circle is towards the point
		let sine = node.yPos+r - y;
		sine = (sine < 1 && sine > 0) || (sine > -1 && sine < 0) ? Math.abs(Math.round(sine)) : sine;
		let cos = node.xPos+r - x;
		cos = cos < 1 && cos > 0 ? Math.round(cos) : cos;

		let angleOfPointRelativeToCircle = Math.atan2(sine, cos);
		let a = Math.atan2(node.physicsBody.velocityY, node.physicsBody.velocityX);

		if (((angleOfPointRelativeToCircle > 0 && a > 0) || (angleOfPointRelativeToCircle < 0 && a < 0) || (angleOfPointRelativeToCircle == a))) {
			return [NaN, NaN];
		}

		return [x, y];

	}		

	collisionWithCorner(node, target, centreX, centreY) {
		let nodeXCenter = centreX;
		let nodeYCenter = centreY;

		let p1 = [target.xPos, target.yPos + target.shape.height];  
		let p2 = [target.xPos + target.shape.width, target.yPos + target.shape.height];  
		let p3 = [target.xPos + target.shape.width, target.yPos + target.shape.height];  
		let p4 = [target.xPos + target.shape.width, target.yPos];  
		let p5 = [target.xPos + target.shape.width, target.yPos];  
		let p6 = [target.xPos, target.yPos];  
		let p7 = [target.xPos, target.yPos];  
		let p8 = [target.xPos, target.yPos + target.shape.height];  

		let c1 = [target.xPos, target.yPos + target.shape.height];
		let c2 = [target.xPos + target.shape.width, target.yPos + target.shape.height];
		let c3 = [target.xPos + target.shape.width, target.yPos];
		let c4 = [target.xPos, target.yPos];

		let withInP1AndP2 = ((nodeXCenter) >= p1[0] && (nodeXCenter) <= p2[0]) && ((nodeYCenter-this.radius) <= p1[1]);
		let withInP3AndP4 = (nodeXCenter-this.radius) <= p3[0] && ((nodeYCenter) <= p3[1]) && ((nodeYCenter) >= p4[1]);
		let withInP5AndP6 = (nodeYCenter+this.radius) >= p6[1] && ((nodeXCenter) >= p6[0]) && ((nodeXCenter) <= p5[0]);
		let withInP7AndP8 = (nodeXCenter+this.radius) >= p7[0] && ((nodeYCenter) <= p8[1]) && ((nodeYCenter) >= p7[1]);

		if ((withInP1AndP2 && withInP5AndP6) || (withInP3AndP4 && withInP7AndP8)) {
			return true;
		}

 		let corners = [c1, c2, c3, c4];

	for (let i = 0; i < corners.length; i++) {
		let distance = Math.hypot(nodeXCenter - corners[i][0], nodeYCenter - corners[i][1]);
		// Check c1
		if (i == 0) {
		if ((distance < this.radius) && nodeXCenter <= target.xPos && nodeXCenter >= target.xPos-this.radius && nodeYCenter >= target.yPos+target.shape.height) {
			return true;
		}
		}
		if (i == 1) {
		// Check c2
		if ((distance < this.radius) && nodeXCenter <= target.xPos+target.shape.width+this.radius && nodeXCenter >= target.xPos+target.shape.width && nodeYCenter >= target.yPos+target.shape.height) {
			return true;
		}
		}
		if (i == 2) {
		// Check c3
		if ((distance < this.radius) && nodeXCenter >= target.xPos+target.shape.width && nodeXCenter <= target.xPos+target.shape.width+this.radius && nodeYCenter <= target.yPos && nodeYCenter >= target.yPos-this.radius) {
			return true;
		}
		}
		if (i == 3) {
		// Check c4
		if ((distance < this.radius) && nodeXCenter <= target.xPos && nodeXCenter >= target.xPos-this.radius && nodeYCenter <= target.yPos && nodeYCenter >= target.yPos-this.radius) {
			return true;
		}
		}
	}
		return false;

	}


	onRectHit(node, target) { 
		let cPoint = target.shape.translateCentre(node, target);
		if (this.collisionWithCorner(node, target, Math.round(cPoint[0]), Math.round(cPoint[1]))) {
			return true;
		}
		return false;
	}

	onCircHit(node, target) {
		if (Math.hypot(node.xPos + node.shape.radius - target.xPos - target.shape.radius, node.yPos + node.shape.radius - target.yPos - target.shape.radius) < node.shape.radius + target.shape.radius) {
			return true;
		}
		return false;
	}


	isHit(node, scene) {
		for (var i = 0; i < scene.children.length; i++) {
			var target = scene.children[i];
			this.target = target;
			if (target === node) {
				continue;
			}
			switch (target.shape.type) {
				case 'circle': if (this.onCircHit(node, target)) { return true; }; break;
				case 'rectangle': if (this.onRectHit(node, target)) { return true; }; break;
				default: if (target.shape.isHit(node, scene)) { return true }; break;
			}
			if (target.children.length > 0) {
				this.isHit(target, node);
			}
		}
		return false;
	}


	create(node, ctx) {
		ctx.save();
		ctx.beginPath();

		ctx.translate(node.anchorPointX, node.anchorPointY); 
		ctx.rotate(node.theta);		
		ctx.translate(-node.anchorPointX, -node.anchorPointY);

		ctx.arc(node.xPos+this.radius, node.yPos+this.radius, this.radius, 0, Math.PI*2, true);

		this.path = new Path2D();
		this.path.arc(node.xPos+this.radius, node.yPos+this.radius, this.radius, 0, Math.PI*2, true);
		ctx.restore();
	}
 
}


class Rect extends Shape { 

	constructor(width, height, lineWidth, fillColor, strokeColor) {
		super(lineWidth, fillColor, strokeColor);
		this.width = width;
		this.height = height;
		this.type = 'rectangle';
	}

	translatePoint(xPos, yPos, node, target) {
		let radius = Math.hypot(node.shape.width, node.shape.height)/2;
		let centre = this.translateCentre(node, target);
		let centreX = centre[0];
		let centreY = centre[1];
		let distanceX = centreX - (node.xPos + this.width/2); 
		let distanceY = centreY - (node.yPos + this.height/2); 
		let x = xPos + distanceX;
		let y = yPos + distanceY;

		let cTheta = Math.atan2((y - centreY),(x - centreX)); 
		let theta = node.theta + cTheta - target.theta;
		let newX = Math.round(centreX + radius * Math.cos(theta));
		let newY = Math.round(centreY + radius * Math.sin(theta));
		return [newX, newY];
	}

	horizontalIntersection(nodeLine, targetLine) {
		// Get nPoints
		let nPoint1 = nodeLine[0];
		let nPoint2 = nodeLine[1];

		if (nPoint2[1] > nPoint1[1]) {
			let prev = nPoint1;
			nPoint1 = nPoint2;
			nPoint2 = prev;
		} 

		// Get tPoints
		let tPoint1 = targetLine[0];
		let tPoint2 = targetLine[1];

		//Get targetY
		let targetY = targetLine[0][1] // Or [1][1]

		if (targetY >= nPoint2[1] && targetY <= nPoint1[1]) {

			let ratio = (nPoint2[1]-nPoint1[1])/(nPoint2[0]-nPoint1[0]);
			let dy = targetY-nPoint1[1];
			let dx = dy/ratio;
			let x = nPoint1[0] + dx;
			if ((x >= tPoint1[0] && x <= tPoint2[0]) || (x <= tPoint1[0] && x >= tPoint2[0])) {
				return true;
			}

		}

		return false;

	}

	verticalIntersection(nodeLine, targetLine) {
		// Get nPoints
		let nPoint1 = nodeLine[0];
		let nPoint2 = nodeLine[1];

		if (nPoint1[0] < nPoint2[0]) {
			let prev = nPoint1;
			nPoint1 = nPoint2;
			nPoint2 = prev;
		} 

		// Get tPoints
		let tPoint1 = targetLine[0];
		let tPoint2 = targetLine[1];

		//Get targetX
		let targetX = targetLine[0][0] // Or [1][0]

		if ((targetX >= nPoint2[0] && targetX <= nPoint1[0])) {

			let ratio = (nPoint2[1]-nPoint1[1])/(nPoint2[0]-nPoint1[0]);
			let dx = targetX-nPoint1[0];
			let dy = dx*ratio;
			let y = nPoint1[1] + dy;
			if ((y >= tPoint1[1] && y <= tPoint2[1]) || (y <= tPoint1[1] && y >= tPoint2[1])) {
				return true;
			}

		}

		return false;
	}

	linesIntersect(nodeLine, targetLine) {
		if (targetLine[0][1] == targetLine[1][1]) { // Horizotal line
			if (this.horizontalIntersection(nodeLine, targetLine)) {
				return true;
			}
		} else { // Vertical line
			if (this.verticalIntersection(nodeLine, targetLine)) {
				return true;
			}
		}
		return false;
	}

	lineIntersection(node, target) {
		let nodeCorners = [this.translatePoint(node.xPos, node.yPos+node.shape.height, node, target), this.translatePoint(node.xPos+node.shape.width, node.yPos+node.shape.height, node, target), this.translatePoint(node.xPos+node.shape.width, node.yPos, node, target), this.translatePoint(node.xPos, node.yPos, node, target)];
		let targetCorners = [[target.xPos, target.yPos+target.shape.height], [target.xPos+target.shape.width, target.yPos+target.shape.height], [target.xPos + target.shape.width, target.yPos], [target.xPos, target.yPos]];
		let nodeLines = [[nodeCorners[0], nodeCorners[1]], [nodeCorners[1], nodeCorners[2]], [nodeCorners[2], nodeCorners[3]], [nodeCorners[3], nodeCorners[0]]];
		let targetLines = [[targetCorners[0], targetCorners[1]], [targetCorners[1], targetCorners[2]], [targetCorners[2], targetCorners[3]], [targetCorners[3], targetCorners[0]]];

		for (var n = 0; n < nodeLines.length; n++) {
			for (var t = 0; t < targetLines.length; t++) {
				if (this.linesIntersect(nodeLines[n], targetLines[t])) {
					console.log('Collision detected!');
					return true;
				}
			}
		}

		return false;
	}

	onRectHit(node, target) {
		if (this.boundingBoxFullyIn(node, target) || this.lineIntersection(node, target)) {
			return true;
		}
		return false;
	}

	isHit(node, scene) {
		for (var i = 0; i < scene.children.length; i++) {
			var target = scene.children[i];
			if (target === node) {
				continue;
			}
			switch (target.shape.type) {
				case 'circle': break;
				case 'rectangle': if (this.onRectHit(node, target)) { return true; }; break;
				default: if (target.shape.isHit(node, scene)) { return true }; break;
			}
			if (target.children.length > 0) {
				this.isHit(target, node); 
			}
		} 
		return false;
	}

	create(node, ctx) {
		ctx.save();
		ctx.beginPath();

		ctx.translate(node.anchorPointX, node.anchorPointY); 
		ctx.rotate(node.theta);
		ctx.translate(-node.anchorPointX, -node.anchorPointY);

		ctx.rect(node.xPos, node.yPos,this.width,this.height);

		this.path = new Path2D();
		this.path.rect(node.xPos, node.yPos,this.width,this.height);
		ctx.restore();
	}

}


class Node {
 	constructor(xPos, yPos, name) {
 		this.xPos = xPos;
 		this.yPos = yPos;
 		this.name = name;
 		this.parent;
 		this.children = [];
 	}
}

class SpriteNode extends Node {

	constructor(xPos, yPos, theta, name) {
		super(xPos, yPos, name);
		this.theta = theta;
		this.shape;
		this.zPosition;
		this.isRotating = false;
		this.anchorPointUpdated = false;
		this.anchorPointX = 0;
		this.anchorPointY = 0;
		this.physicsBody;
		this.p = NaN;
	}

	isHit() {

	}

	setShape(shape) {
		this.shape = shape;
	}

	setX(x) {
		this.anchorPointX += x - this.xPos;
		this.xPos = x;
	}

	setY(y) {
		this.anchorPointY += y - this.yPos;
		this.yPos = y;
	}

	changeXBy(dX) {
		this.xPos += dX;
		this.anchorPointX += dX;
	}

	changeYBy(dY) {
		this.yPos += dY;
		this.anchorPointY += dY;
	}

	rotateBy(theta) {
		if (!this.anchorPointUpdated) {
			var minLeft = this.getMinLeft(0, this.xPos);
			var maxRight = this.getMaxRight(0, this.xPos);
			var minUp = this.getMinUp(0, this.yPos);
			var maxDown = this.getMaxDown(0, this.yPos);
			this.anchorPointX = minLeft + (maxRight-minLeft)/2;
			this.anchorPointY = minUp + (maxDown-minUp)/2;
			this.anchorPointUpdated = true;
		}
		this.theta += theta;
		this.isRotating = true;
	}

	addChild(child) {
		this.children.push(child);
		child.parent = this;
	}

	getMinLeft(x, minLeft) {
		var nextMinLeft = minLeft < x + this.xPos ? minLeft : x + this.xPos;
		for (var i = 0; i < this.children.length; i++) {
			nextMinLeft = this.children[i].getMinLeft(x + this.xPos, nextMinLeft);
		}
		return nextMinLeft;
	}
	getMaxRight(x, maxRight) {
		var xReach;
		if (this.shape) {
			xReach = x + this.xPos + this.shape.width;
		} else {
			xReach = x + this.xPos;
		}
		var nextMaxRight = maxRight > xReach ? maxRight : xReach;
		for (var i = 0; i < this.children.length; i++) {
			nextMaxRight = this.children[i].getMaxRight(x + this.xPos, nextMaxRight);
		}
		return nextMaxRight;
	}
	getMinUp(y, minUp) {
		var nextMinUp = minUp < y + this.yPos ? minUp : y + this.yPos;
		for (var i = 0; i < this.children.length; i++) {
			nextMinUp = this.children[i].getMinUp(y + this.yPos, nextMinUp);
		}
		return nextMinUp;
	}
	getMaxDown(y, maxDown) {
		var yReach;
		if (this.shape) {
			yReach = y + this.yPos + this.shape.height;
		} else {
			yReach = y + this.yPos;
		}
		var nextMaxDown = maxDown > yReach ? maxDown : yReach;
		for (var i = 0; i < this.children.length; i++) {
			nextMaxDown = this.children[i].getMaxDown(y + this.yPos, nextMaxDown);
		}
		return nextMaxDown;
	}

}

class Scene extends SpriteNode {
	constructor () {
		super(0, 0, 0, 'scene');

		var rect3 = new SpriteNode(sP()[0], sP()[1], 0, 'rect3');
		rect3.setShape(new Circle(50, 3, 'red', 'black'));
		rect3.physicsBody = new PhysicsBody(rect3, 2);

		var rect3_1 = new SpriteNode(400, 340, 0, 'rect3_1');
		rect3_1.setShape(new Rect(400, 100, 3, 'green', 'black'));
		//rect3_1.rotateBy(1);

		this.addChild(rect3_1);
		this.addChild(rect3);
	}
}

class Player extends SpriteNode {
	constructor () {
		super(0, 0, 0, 'player');
		this.setShape(new Circle(50, 5, 'blue', 'black'));
		this.physicsBody = new PhysicsBody(this, 2);
	}
}

function sP() {
	return [480, 20];
}

class PhysicsBody {

	constructor(node, mass) {
		this.node = node;
		this.physicsMask = node.shape;
		this.physicsMask.physicsActive = true;
		this.gravity = 1;
		this.velocityX = 0;
		this.velocityY = 0;
		this.speed = 0;
		this.angularVelocity = 0;
		this.mass = mass;
		this.alpha = 0; 
		this.isTouching2 = false;
	}

	setGravity(gravity) {
		this.gravity = gravity;
	}

	changeXVelocityBy(vX) {
		this.velocityX += vX;
	}

	changeYVelocityBy(vY) {
		this.velocityY += vY;
	}

	move() {
		this.node.changeXBy(this.velocityX);
		this.node.changeYBy(this.velocityY); 
	}

	rotateBy(theta, alpha) {
		this.alpha += alpha; 
		this.node.rotateBy(theta + alpha);
		this.node.changeXBy(this.node.shape.radius * (theta + alpha));
	}

	getClosestOfThePoints(collidingCorners, target) {
		if (collidingCorners.length == 0) {
			return NaN;
		}
		var closestDistances = [];
		var original = [];
		let tP = this.physicsMask.translateCentre(this.node, target);
		for (var i = 0; i < collidingCorners.length; i++) {
			let value = Math.hypot(tP[0]-collidingCorners[i][0], tP[1]-collidingCorners[i][1]);
			closestDistances.push(value);
			original.push(value);
		}
		let closestDistance = closestDistances.sort(function(a,b){return a - b})[0];
		let index = original.indexOf(closestDistance); 
		return collidingCorners[index];
	}

	getClosestCollidingCorner(target) {
		let corners = [[target.xPos, target.yPos], [target.xPos, target.yPos+target.shape.height], [target.xPos+target.shape.width, target.yPos+target.shape.height], [target.xPos+target.shape.width, target.yPos]];
		var collidingCorners = [];
		for (var i = 0; i < corners.length; i++) {
			if (this.physicsMask.getPointOfCollisionForCircleAroundCorner(this.node, target, corners[i])[0]) {
				collidingCorners.push(corners[i]);
			}  
		}
		return this.getClosestOfThePoints(collidingCorners, target);
	}

	isWithInBoundaries(p, corner1, corner2, isHorizontal) {
		if (isHorizontal) {
			return ((corner1[0] <= p[0]) && (corner2[0] >= p[0])) || ((corner1[0] >= p[0]) && (corner2[0] <= p[0]));
		} 
		return ((corner1[1] <= p[1]) && (corner2[1] >= p[1])) || ((corner1[1] >= p[1]) && (corner2[1] <= p[1]));
	}

	pointIsNotBehind(p, vX, vY, centreX, centreY) {
		let dir1 = Math.round(Math.atan2(-(centreY) + p[1], -(centreX) + p[0]));
		let dir2 = Math.round(Math.atan2(vY, vX));
		return dir1 == dir2;
	}

	getPointOfIntersectionBetweenCorners(target, corner1, corner2) {
		let isHorizontal = corner1[1] == corner2[1];
		let r = this.physicsMask.radius;
		let translation = this.physicsMask.getTranslatedPositionsAndVelocities(this.node, target);
		let centreX = translation[0];
		let centreY = translation[1];
		let vX = translation[2];
		let vY = translation[3];
		let dir = Math.atan2(vY, vX);
		let b = centreY - Math.tan(dir)*centreX;
		if (isHorizontal) {
			let x = (corner1[1] - b)/Math.tan(dir);
			let dX = (r * 1/Math.tan(dir))*(corner1[1] > centreY ? -1 : 1);
			let p = [x+dX, corner1[1]+r*(corner1[1] > centreY ? -1 : 1)]; 
			return this.isWithInBoundaries(p, corner1, corner2, isHorizontal) && this.pointIsNotBehind(p, vX, vY, centreX, centreY) ? p : NaN;
		} else { 
			let y = Math.tan(dir)*corner1[0] + b;
			let dY = (r * Math.tan(dir))*(corner1[0] > centreX ? -1 : 1);
			let p = [corner1[0]+r*(corner1[0] > centreX ? -1 : 1), y+dY];
			return this.isWithInBoundaries(p, corner1, corner2, isHorizontal) && this.pointIsNotBehind(p, vX, vY, centreX, centreY) ? p : NaN;
		}
		return NaN;
	}

	getAllIntersectingEdges(target) {
		let corners = [[target.xPos, target.yPos], [target.xPos, target.yPos+target.shape.height], [target.xPos+target.shape.width, target.yPos+target.shape.height], [target.xPos+target.shape.width, target.yPos]];
		var intersectingEdges = [];
		for (let i = 0; i < corners.length; i++) {
			let p = this.getPointOfIntersectionBetweenCorners(target, corners[i], corners[(i+1)%corners.length]);
			if (p) {
				intersectingEdges.push(p);
			}
		}	
		return intersectingEdges;
	}

	getPointOnEdge(target) {
		let intersectingEdges = this.getAllIntersectingEdges(target);
		if (intersectingEdges.length > 0) {
			let result = this.getClosestOfThePoints(intersectingEdges, target);
			return result;
		}
		return NaN;
	}

	translateBack(point, target) {
		if (!point) {
			return NaN;
		}
		let r = this.physicsMask.radius;
		let x = point[0]; 
		let y = point[1];
		let radius = Math.hypot(x-(target.xPos+target.shape.width/2), y-(target.yPos+target.shape.height/2));
		let theta = Math.atan2((y-(target.yPos+target.shape.height/2)),(x-(target.xPos+target.shape.width/2))) + target.theta;
		x = (target.xPos+(target.shape.width/2) + radius * Math.cos(theta));
		y = (target.yPos+(target.shape.height/2) + radius * Math.sin(theta));
		return [x, y];
	}

	centreDistanceToPoint(point) {
		return Math.hypot(this.node.xPos+this.physicsMask.radius - point[0], this.node.yPos+this.physicsMask.radius - point[1]);
	}

	cornerIsCloser(points, hittingEdge) {
		if (hittingEdge && points.length > 1) {
			return this.centreDistanceToPoint(points[0]) > this.centreDistanceToPoint(points[1]);
		} 
		if (!hittingEdge && points.length == 1) {
			return true;
		}
		return false;
	}

	isAtOneOfTheEdges(corners, r, target) {
		let centre = this.physicsMask.translateCentre(this.node, target);
		let centreX = centre[0];
		let centreY = centre[1];
		let edge1 = [corners[0], corners[1]];
		let edge2 = [corners[1], corners[2]];
		let edge3 = [corners[2], corners[3]];
		let edge4 = [corners[3], corners[0]];
		let edges = [edge1, edge2, edge3, edge4];

		for (var i = 0; i < edges.length; i++) {
			if (edges[i][0][1] == edges[i][1][1]) {
				// Horizontal
				if (Math.round(centreY) == (edges[i][0][1] == target.yPos ? edges[i][0][1]-r : edges[i][0][1]+r)) {
					if (centreX >= edge1[0][0] && centreX <= edge1[1][0]) {
						return true;
					}
					if (centreX <= edge3[0][0] && centreX >= edge3[1][0]) {
						return true;
					}
				}
			} else {
				// Vertical
				if (Math.round(centreX) == target.xPos-r || Math.round(centreX) == target.xPos+target.shape.width+r) {
					if (centreY <= edge2[0][1] && centreY >= edge2[1][1]) {
						return true;
					}
					if (centreY >= edge4[0][1] && centreY <= edge4[1][1]) {
						return true;
					}
				}
			}
		}

		return false;
	}

	isAtOneOfTheCorners(corners, r, target) {
		let centre = this.physicsMask.translateCentre(this.node, target);
		let centreX = centre[0];
		let centreY = centre[1];
		for (var i = 0; i < corners.length; i++) {
			let corner = corners[i];
			if (Math.round(Math.hypot(centreX-corner[0], centreY-corner[1])) == r) {
				return true;
			}
		}
		return false;
	}

	centreAlreadyAtCollisionPoint(r, target) {
		let w = target.shape.width;
		let h = target.shape.height;		
		let corners = [[target.xPos, target.yPos+h], [target.xPos+w, target.yPos+h], [target.xPos+w, target.yPos], [target.xPos, target.yPos]];
		let isAtACorner = this.isAtOneOfTheCorners(corners, r, target);
		let isAtAnEdge = this.isAtOneOfTheEdges(corners, r, target);
		return isAtAnEdge || isAtACorner;
	}

	getPointOfCollision(r, target) {
		if (this.velocityX == 0 && this.velocityY == 0) {
			return NaN;
		}
		let pointOnEdge = this.translateBack(this.getPointOnEdge(target), target);
		var points = [];
		let hittingEdge = false;
		if (pointOnEdge) {
			points.push(pointOnEdge);
			hittingEdge = true;
		}
		let corner = this.getClosestCollidingCorner(target);
		if (corner) {
			points.push(this.physicsMask.getPointOfCollisionForCircleAroundCorner(this.node, target, corner));
		}
		if (this.cornerIsCloser(points, hittingEdge) && points.length > 0) {
			return points.length > 1 ? points[1] : points[0];
		} else if (hittingEdge) {
			return points[0];
		}
		return NaN;
	}


	applyGravitation() {
		this.changeYVelocityBy(this.gravity);
	}


	

	passedPointOfCollision(prevP, curtP, pointOfCollision) {
		let dY1 = prevP[1] - pointOfCollision[1];
		let dY2 = curtP[1] - pointOfCollision[1];
		let dX1 = prevP[0] - pointOfCollision[0];
		let dX2 = curtP[0] - pointOfCollision[0];
		return dY1 == -dY2 && dX1 == -dX2;
	}





	simulateCircle(r, target) {
		let isTouching = this.centreAlreadyAtCollisionPoint(r, target);
		let pointOfCollision = this.getPointOfCollision(r, target);
		let prevP = [this.node.xPos+r, this.node.yPos+r];
		if (!isTouching) {
			this.move();
			let curtP = [this.node.xPos+r, this.node.yPos+r];
			if (this.passedPointOfCollision(prevP, curtP, pointOfCollision)) {
				this.node.setX(pointOfCollision[0] - r);
				this.node.setY(pointOfCollision[1] - r);
			}	
		} 
		//console.log(pointOfCollision);
		//console.log(isTouching);
	}






















	simulateFrame() {

		let target = this.node.parent.children[0];
		
		let shape = this.physicsMask.type;
		switch (shape) {
			case "circle": let r = this.physicsMask.radius; this.simulateCircle(r, target);
			break;
		}

	}

}

function start() {

// Getting canvas and context
	let canvas = document.getElementById('test');
	let ctx = canvas.getContext('2d');
// Initializing scene 
	var scene = new Scene();
	scene.ctx = ctx; // To remove when done with circle-line collision
//
 
// Game loop
	var rotateClockwise2 = false;
	var rotateCounterClockwise2 = false;
	var rotateClockwise = false;
	var rotateCounterClockwise = false;
	var moveUp = false;
	var moveDown = false;
	var moveLeft = false;
	var moveRight = false;

	document.addEventListener('keydown', function(e){
		switch (e.keyCode) {
			case 37: rotateCounterClockwise=true;break;
			case 39: rotateClockwise=true;break;
			case 38: moveUp=true;break;
			case 40: moveDown=true;break;
			case 87: rotateClockwise2=true;break;
			case 83: rotateCounterClockwise2=true;break;
			case 65: moveLeft=true;break;
			case 68: moveRight=true;break;
		}
	});
	document.addEventListener('keyup', function(e){
		switch (e.keyCode) {
			case 37: rotateCounterClockwise=false;scene.children[1].physicsBody.velocityX = 0;break;
			case 39: rotateClockwise=false;scene.children[1].physicsBody.velocityX = 0;break;
			case 38: moveUp=false;scene.children[1].physicsBody.velocityY = 0;break;
			case 40: moveDown=false;scene.children[1].physicsBody.velocityY = 0;break;
			case 87: rotateClockwise2=false;break;
			case 83: rotateCounterClockwise2=false;break;
			case 65: moveLeft=false;break;
			case 68: moveRight=false;break;
		}
	});
 	window.setInterval(gameLoop, 1000/60);
//
	function gameLoop() {
		var speed = 5; 
		if(moveUp) {
			scene.children[1].physicsBody.velocityY = -speed;
	 		//scene.children[1].physicsBody.velocityY += -4;
	 	}
	 	if(moveDown) {
	 		scene.children[1].physicsBody.velocityY = speed;
	 		//scene.children[1].changeYBy(speed);
	 	};
	 	if(moveLeft) {
	 		//scene.children[0].rotateBy(-0.03);
	 	}
	 	if(moveRight) {
	 		//scene.children[0].rotateBy(0.03);
	 	};
	 	if(rotateClockwise) {	 	
	 		scene.children[1].physicsBody.velocityX = speed;	
	 		//console.log(1);
	 		//scene.children[1].physicsBody.rotateBy(0.07, 0);
	 		//scene.children[1].velocityX = 2;
	 	}
	 	if(rotateCounterClockwise) {
	 		scene.children[1].physicsBody.velocityX = -speed;
	 		//scene.children[1].physicsBody.rotateBy(-0.07, 0);
	 	}
	 	if(rotateClockwise2) {
	 		//scene.children[1].rotateBy(-0.03);
	 	}
	 	if(rotateCounterClockwise2) {
	 		//scene.children[1].rotateBy(0.03);
	 	}
	 	ctx.clearRect(0, 0, canvas.width, canvas.height);
	 	renderNode(scene, ctx);
	}


}


function renderNode(parent, ctx) {

	for (var i = 0; i < parent.children.length; i++) {

		var node = parent.children[i];

		node.changeXBy(parent.xPos);
		node.changeYBy(parent.yPos);

		if (parent.isRotating) {
			node.isRotating = true;
			node.anchorPointX = parent.anchorPointX;
			node.anchorPointY = parent.anchorPointY;
			node.theta = parent.theta;
		}


		//Physics  
		if (node.physicsBody) {
			node.physicsBody.simulateFrame();
		}

		// Render
		node.shape.create(node, ctx);

		ctx.fillStyle = node.shape.fillColor;
		ctx.strokeStyle = node.shape.strokeColor;
		ctx.lineWidth = node.shape.lineWidth;
		


		ctx.fill();
		ctx.stroke();
		if (node.children.length > 0) {
			renderNode(node, ctx);
		}

		node.changeXBy(-parent.xPos);
		node.changeYBy(-parent.yPos);

	}

	parent.isRotating = false;

}



