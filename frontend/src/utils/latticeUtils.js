import * as THREE from 'three';

const factorize = (numerator, denominator) => {
  const factors = {};
  const primeFactorize = (num, sign = 1) => {
    let n = Math.abs(num);
    for (let i = 2; i <= n; i++) {
      while (n % i === 0) {
        factors[i] = (factors[i] || 0) + sign;
        n /= i;
      }
    }
  };
  primeFactorize(numerator, 1);
  primeFactorize(denominator, -1);
  return factors;
};

const computePosition = (factors, spacing = 2) => {
  let x = 0, y = 0, z = 0;
  Object.entries(factors).forEach(([prime, exponent]) => {
    if (parseInt(prime) === 3) x = exponent * spacing;
    if (parseInt(prime) === 5) y = exponent * spacing;
    if (parseInt(prime) === 7) z = exponent * spacing;
  });
  return { x, y, z };
};

const addLabels = (text) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  context.fillStyle = 'white';
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = 'black';
  context.font = '64px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.transparent = true;

  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  return sprite;
};

const findNeighbours = (position, spheresRef, spacing = 2) => {
  const neighbours = [];
  spheresRef.current.forEach(({ sphere }) => {
    const { x, y, z } = sphere.position;
    if (
      (Math.abs(x - position.x) === spacing && y === position.y && z === position.z) ||
      (Math.abs(y - position.y) === spacing && x === position.x && z === position.z) ||
      (Math.abs(z - position.z) === spacing && x === position.x && y === position.y)
    ) {
      neighbours.push(sphere.position);
    }
  });
  return neighbours;
}

export const generateLattice = (newRatio, scene, spheresRef) => {
  const [numerator, denominator] = newRatio.split('/').map(Number);
  if (isNaN(numerator) || isNaN(denominator)) {
    console.error("Invalid ratio input:", newRatio);
    return;
  }

  const factors = factorize(numerator, denominator);
  const position = computePosition(factors);

  const geometry = new THREE.SphereGeometry(0.2, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 'red' });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(position.x, position.y, position.z);

  const label = addLabels(newRatio);
  label.position.set(position.x, position.y + 0.4, position.z);

  const neighbouringPositions = findNeighbours(position, spheresRef);
  neighbouringPositions.forEach((neighbourPos) => {
    const points = [neighbourPos, sphere.position];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    spheresRef.current.push({ sphere, label, line });
  });

  spheresRef.current.push({ sphere, label });
  scene.add(sphere);
  scene.add(label);
};

export const undoLast = (scene, spheresRef, renderer, camera) => {
  if (spheresRef.current.length > 0) {
    const lastObject = spheresRef.current.pop();
    const { sphere, label } = lastObject;

    if (sphere) scene.remove(sphere);
    if (label) scene.remove(label);

    spheresRef.current = spheresRef.current.filter(({ line }) => {
      if (line) {
        const points = line.geometry.attributes.position.array;
        const spherePos = [sphere.position.x, sphere.position.y, sphere.position.z];
        const isConnected =
          (points[0] === spherePos[0] && points[1] === spherePos[1] && points[2] === spherePos[2]) ||
          (points[3] === spherePos[0] && points[4] === spherePos[1] && points[5] === spherePos[2]);
        if (isConnected) {
          scene.remove(line);
          return false;
        }
      }
      return true;
    });

    if (renderer && camera) {
      renderer.render(scene, camera);
    }
  } else {
    console.log("No spheres left to remove");
  }
};
