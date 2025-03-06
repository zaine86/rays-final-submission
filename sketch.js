let walls = [];
let particle;
let rayCount = 1;

// Track the current and previous half-wall section
let currentHalf = -1;
let previousHalf = -1;

// Button properties
let buttons = [];

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Define the two intersecting diagonal walls
  walls.push(new Boundary(0, 0, width, height)); // First diagonal line
  walls[0].stretchToScreen();

  walls.push(new Boundary(width, 0, 0, height)); // Second diagonal line
  walls[1].stretchToScreen();

  // Define the screen edges as walls
  walls.push(new Boundary(-1, -1, width, -1)); // Top wall
  walls.push(new Boundary(width, -1, width, height)); // Right wall
  walls.push(new Boundary(width, height, -1, height)); // Bottom wall
  walls.push(new Boundary(-1, height, -1, -1)); // Left wall

  particle = new Particle(); // Instantiate the particle
  noCursor();

  // Create buttons entirely within each section
  buttons.push(
    new Button(
      width * 0.25, // Left section
      height * 0.5,
      "FAQ",
      color(255, 0, 0),
      () => alert("Redirecting to FAQ...")
    )
  );
  buttons.push(
    new Button(
      width * 0.75, // Right section
      height * 0.5,
      "Portfolio",
      color(0, 255, 0),
      () => alert("Redirecting to Portfolio...")
    )
  );
  buttons.push(
    new Button(
      width * 0.5, // Top section
      height * 0.25,
      "About me",
      color(0, 0, 255),
      () => alert("Redirecting to About me...")
    )
  );
  buttons.push(
    new Button(
      width * 0.5, // Bottom section
      height * 0.75,
      "Contact",
      color(255, 255, 0),
      () => alert("Going back to the Contact...")
    )
  );
}

function draw() {
  background(0);

  // Check if the cursor is over any parent button
  let isHoveringParentButton = false;
  for (let button of buttons) {
    if (button.contains(mouseX, mouseY)) {
      isHoveringParentButton = true;
      break;
    }
  }

  // Check if any child buttons are visible
  let areChildButtonsVisible = buttons.some(button => button.children);

  // Show or hide diagonal walls based on hover and child button visibility
  if (isHoveringParentButton || areChildButtonsVisible) {
    // Hide diagonal walls
    for (let i = 2; i < walls.length; i++) {
      walls[i].show(); // Show only screen edge walls
    }
  } else {
    // Show all walls, including diagonal walls
    for (let wall of walls) {
      wall.show();
    }
  }

  let half = getHalfWall(particle.pos);
  if (half !== currentHalf) {
    previousHalf = currentHalf;
    currentHalf = half;
  }

  let sectionColor = getHalfWallColor(currentHalf);

  // Check if the cursor is over any button
  let isHovering = false;
  let isHoveringCloseButton = false;
  let isHoveringChildButton = false; // Track if hovering over any child button
  for (let button of buttons) {
    if (button.contains(mouseX, mouseY)) {
      isHovering = true;
      // Generate child buttons if they don't exist
      if (!button.children) {
        button.createChildren();
        button.childCreationTime = millis(); // Record the time when children are created
      }
    }
    // Check if the cursor is over the close button
    if (button.closeButton && button.closeButton.contains(mouseX, mouseY)) {
      isHoveringCloseButton = true;
    }
    // Check if the cursor is over any child button
    if (button.children) {
      for (let child of button.children) {
        if (child.contains(mouseX, mouseY)) {
          isHoveringChildButton = true;
          break;
        }
      }
    }
  }

  // Display parent buttons
  for (let button of buttons) {
    if (button.contains(mouseX, mouseY) && mouseIsPressed) {
      button.show(sectionColor, 255); // Full opacity when hovered
    } else {
      button.show(sectionColor, 150); // Semi-transparent otherwise
    }

    // Display child buttons if they exist and less than 3 seconds have passed since the last interaction
    if (button.children && millis() - button.childCreationTime < 3000) {
      for (let child of button.children) {
        if (child.isExploding) {
          child.explode(); // Handle explosion animation
        } else {
          child.show(sectionColor, child.contains(mouseX, mouseY) ? 255 : 150); // Change opacity when hovered
        }
      }
      // Display the close button
      button.showCloseButton(sectionColor);
    } else {
      button.children = null; // Remove children after 3 seconds of inactivity
    }
  }

  // Draw the central circle with text only if no child buttons are visible
  if (!areChildButtonsVisible) {
    drawCentralCircle();
  }

  particle.update(mouseX, mouseY);
  particle.show(sectionColor);
  particle.look(walls, sectionColor, isHovering, areChildButtonsVisible, isHoveringCloseButton, isHoveringChildButton); // Pass whether child buttons are visible and if hovering over close button or child button
}

// Draw the central circle with text
function drawCentralCircle() {
  let circleDiameter = 200; // Diameter of the circle
  let circleX = width / 2; // Center X
  let circleY = height / 2; // Center Y
  let textContent = "check sections content"; // Text to display

  // Draw the circle
  fill(255); // White fill color
  stroke(255);
  strokeWeight(2);
  ellipse(circleX, circleY, circleDiameter);

  // Draw the text
  textSize(16); // Set text size
  textAlign(CENTER, CENTER); // Center the text
  fill(0); // Black text color
  textStyle(BOLD); // Bold text
  noStroke();
  text(textContent, circleX, circleY); // Display text
}

// Handle button clicks
function mousePressed() {
  for (let button of buttons) {
    if (button.contains(mouseX, mouseY)) {
      button.action(); // Trigger parent button action
    }
    // Check child buttons if they exist
    if (button.children) {
      for (let child of button.children) {
        if (child.contains(mouseX, mouseY) && !child.isExploding) {
          child.explode(); // Trigger explosion animation
          button.childCreationTime = millis(); // Reset the timeout on interaction
        }
      }
    }
    // Check close button if it exists
    if (button.closeButton && button.closeButton.contains(mouseX, mouseY)) {
      button.children = null; // Hide child buttons
      button.childCreationTime = millis(); // Reset the timeout on interaction
    }
  }
}

function getHalfWall(pos) {
  let line1 = pos.y - pos.x; // If this is positive, below the first diagonal
  let line2 = pos.y + pos.x - height; // If this is positive, below the second diagonal

  if (line1 > 0 && line2 > 0) return 0; // Bottom-left quadrant
  if (line1 <= 0 && line2 > 0) return 1; // Bottom-right quadrant
  if (line1 > 0 && line2 <= 0) return 2; // Top-left quadrant
  return 3; // Top-right quadrant
}

function getHalfWallColor(half) {
  // Define unique colors for each section
  const sectionColors = [
    color(255, 0, 0),   // Red for bottom-left quadrant (section 0)
    color(0, 255, 0),   // Green for bottom-right quadrant (section 1)
    color(0, 0, 255),   // Blue for top-left quadrant (section 2)
    color(255, 255, 0)  // Yellow for top-right quadrant (section 3)
  ];

  // Return the color for the current section
  return sectionColors[half];
}

class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
  }

  stretchToScreen() {
    let dir = p5.Vector.sub(this.b, this.a).normalize();
    this.a = this.extendPoint(this.a, dir, -width * 2);
    this.b = this.extendPoint(this.b, dir, width * 2);
  }

  extendPoint(pt, dir, dist) {
    let extended = p5.Vector.add(pt, p5.Vector.mult(dir, dist));
    extended.x = constrain(extended.x, 0, width);
    extended.y = constrain(extended.y, 0, height);
    return extended;
  }

  show() {
    stroke(255);
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }
}

class Particle {
  constructor() {
    this.pos = createVector(width / 2, height / 2);
    this.rays = [];
    for (let a = 0; a < 360; a += rayCount) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }
  }

  update(x, y) {
    this.pos.set(x, y);
  }

  look(walls, col, isHovering, areChildrenVisible, isHoveringCloseButton, isHoveringChildButton) {
    // Only draw rays if not hovering over child buttons
    if (!isHoveringChildButton) {
      for (let ray of this.rays) {
        let closest = null;
        let record = Infinity;

        for (let wall of walls) {
          const pt = ray.cast(wall);
          if (pt) {
            const d = p5.Vector.dist(this.pos, pt);
            if (d < record) {
              record = d;
              closest = pt;
            }
          }
        }

        if (closest) {
          // Lower the opacity of the rays
          let opacity = 50; // Reduced opacity for rays
          stroke(col.levels[0], col.levels[1], col.levels[2], opacity);
          // Reduce ray length if hovering over the close button
          let rayLength = isHoveringCloseButton ? 5 : 10;
          line(this.pos.x, this.pos.y, closest.x, closest.y);
        }
      }
    }
  }

  show(col) {
    fill(200);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 4);
    for (let ray of this.rays) {
      ray.show(col);
    }
  }
}

class Ray {
  constructor(pos, angle) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
  }

  show(col) {
    stroke(col.levels[0], col.levels[1], col.levels[2], 50); // Reduced opacity
    push();
    translate(this.pos.x, this.pos.y);
    line(0, 0, this.dir.x * 10, this.dir.y * 10);
    pop();
  }

  cast(wall) {
    const { x: x1, y: y1 } = wall.a;
    const { x: x2, y: y2 } = wall.b;
    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) return;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0) {
      return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }
  }
}

class Button {
  constructor(x, y, label, baseColor, action) {
    this.x = x;
    this.y = y;
    this.w = 200; // Increased width
    this.h = 70;  // Increased height
    this.label = label;
    this.baseColor = baseColor;
    this.action = action; // Function to execute on click
    this.children = null; // Initialize children as null
    this.childCreationTime = 0; // Track when children are created
    this.closeButton = null; // Initialize close button as null
  }

  contains(mx, my) {
    return (
      mx > this.x - this.w / 2 &&
      mx < this.x + this.w / 2 &&
      my > this.y - this.h / 2 &&
      my < this.y + this.h / 2
    );
  }

  show(outlineColor, opacity) {
    fill(
      red(this.baseColor),
      green(this.baseColor),
      blue(this.baseColor),
      opacity
    );
    stroke(outlineColor);
    strokeWeight(4);
    rectMode(CENTER);
    rect(this.x, this.y, this.w, this.h);

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(18); // Increased text size
    text(this.label, this.x, this.y);
  }

  createChildren() {
    this.children = [];
    let section = getHalfWall(createVector(this.x, this.y)); // Determine the section of the parent button

    // Define child button labels based on the parent button's label
    let childLabels = [];
    if (this.label === "FAQ") {
      childLabels = ["International FAQ", "National FAQ", "Custom FAQ"];
    } else if (this.label === "Portfolio") {
      childLabels = ["Projects", "Moodboards", "Logbooks"];
    } else if (this.label === "Contact") {
      childLabels = ["Socials", "Others", "Sample msg"];
    } else if (this.label === "About me") {
      childLabels = ["My story", "Awards", "Notes"];
    }

    for (let i = 0; i < childLabels.length; i++) {
      let childX, childY;

      // Calculate child button positions based on the section
      if (this.y < height / 2) {
        // Parent button is in the top half: Place children below
        childX = this.x;
        childY = this.y + (i + 1) * (this.h + 20); // Spread children vertically below (adjusted spacing)
      } else {
        // Parent button is in the bottom half: Place children above
        childX = this.x;
        childY = this.y - (i + 1) * (this.h + 20); // Spread children vertically above (adjusted spacing)
      }

      this.children.push(
        new ChildButton(
          childX,
          childY,
          childLabels[i], // Use the predefined label
          color(255, 100, 100), // Child button color
          () => alert(`${childLabels[i]} clicked!`)
        )
      );
    }

    // Create the close button
    this.closeButton = new CloseButton(
      this.x + this.w / 2 + 20, // Position it to the right of the parent button (adjusted spacing)
      this.y,
      color(255, 0, 0)
    );
  }

  showCloseButton(outlineColor) {
    if (this.closeButton) {
      this.closeButton.show(outlineColor);
    }
  }
}

class ChildButton extends Button {
  constructor(x, y, label, baseColor, action) {
    super(x, y, label, baseColor, action);
    this.isExploding = false;
    this.explosionParticles = [];
    this.explosionStartTime = 0;
  }

  explode() {
    this.isExploding = true;
    this.explosionStartTime = millis();
    // Create particles for explosion
    for (let i = 0; i < 50; i++) {
      this.explosionParticles.push(new ExplosionParticle(this.x, this.y, this.baseColor));
    }
  }

  show(outlineColor, opacity) {
    if (this.isExploding) {
      // Display explosion particles
      for (let particle of this.explosionParticles) {
        particle.update();
        particle.show();
      }
      // Reset after 1 second
      if (millis() - this.explosionStartTime > 1000) {
        this.isExploding = false;
        this.explosionParticles = [];
      }
    } else {
      super.show(outlineColor, opacity);
    }
  }
}

class ExplosionParticle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(2, 5));
    this.col = col;
    this.lifespan = 255;
  }

  update() {
    this.pos.add(this.vel);
    this.lifespan -= 5;
  }

  show() {
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.lifespan);
    ellipse(this.pos.x, this.pos.y, 8);
  }
}

class CloseButton {
  constructor(x, y, baseColor) {
    this.x = x;
    this.y = y;
    this.r = 20; // Increased radius of the close button
    this.baseColor = baseColor;
  }

  contains(mx, my) {
    return dist(mx, my, this.x, this.y) < this.r;
  }

  show(outlineColor) {
    fill(this.baseColor);
    stroke(outlineColor);
    strokeWeight(2);
    ellipse(this.x, this.y, this.r * 2);

    // Draw an "X" inside the circle
    stroke(255);
    strokeWeight(2);
    line(this.x - this.r / 2, this.y - this.r / 2, this.x + this.r / 2, this.y + this.r / 2);
    line(this.x + this.r / 2, this.y - this.r / 2, this.x - this.r / 2, this.y + this.r / 2);
  }
}