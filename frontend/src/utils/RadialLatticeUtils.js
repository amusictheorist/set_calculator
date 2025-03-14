import * as THREE from 'three';

const captureRatio = (input) => {
  const [numerator, denominator] = input.split('/').map(Number);

  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    console.error(`Invalid ratio captured: ${input}. Numerator: ${numerator}, Denominator: ${denominator}`);
    return null;
  }

  return { string: input, values: [numerator, denominator] };
};

const log2 = (n) => Math.log(n) / Math.log(2);

const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const closestPowerOf2 = (n) => {
  if (n <= 0) return null;
  const exponent = Math.floor(Math.log2(n));
  return Math.pow(2, exponent);
};

const analyzeNumber = (n) => {
  if (isPrime(n)) return { type: 'prime' };
  for (let base = 2; base <= Math.sqrt(n); base++) {
    let exp = 2;
    while (Math.pow(base, exp) <= n) {
      if (Math.pow(base, exp) === n) return { type: 'perfectPower', base, exponent: exp };
      exp++;
    }
  }
  return { type: 'composite' };
};

const factorize = (input) => {
  const ratio = captureRatio(input);
  if (!ratio) return {};

  const factors = {};
  const primeFactorize = (num, sign) => {
    let n = Math.abs(num);
    for (let i = 2; i <= n; i++) {
      while (n % i === 0) {
        factors[i] = (factors[i] || 0) + sign;
        n /= i;
      }
    }
  };

  primeFactorize(ratio.values[0], 1);
  primeFactorize(ratio.values[1], -1);

  return factors;
};

const computePosition = (factors, input) => {
  const ratioData = captureRatio(input);
  if (!ratioData) return { x: 0, y: 0, z: 0 };

  const { values: [numerator, denominator] } = ratioData;
  const ratio = numerator / denominator;
  if (!Number.isFinite(ratio)) return { x: 0, y: 0, z: 0 };

  const analysis = analyzeNumber(numerator);
  let r = 2;
  let x = 0, y = 0, z = 0;

  if (analysis.type === 'prime') {
    const radians = log2(ratio) * (Math.PI * 2);
    x = r * Math.sin(radians);
    y = r * Math.cos(radians);
  } else if (analysis.type === 'perfectPower') {
    const radians = log2(analysis.base) * (Math.PI * 2);
    r *= analysis.exponent;
    x = r * Math.sin(radians);
    y = r * Math.cos(radians);
  } else if (analysis.type === 'composite') {
    const primeFactors = Object.entries(factors).filter(([_, exp]) => exp > 0);
    if (primeFactors.length === 2) {
      const [[prime1, exp1], [prime2, exp2]] = primeFactors.map(([p, e]) => [parseInt(p), e]);

      const angle1 = log2(prime1) * (Math.PI * 2);
      const angle2 = log2(prime2) * (Math.PI * 2);

      x = (2 * exp1) * Math.sin(angle1) + (2 * exp2) * Math.sin(angle2);
      y = (2 * exp1) * Math.cos(angle1) + (2 * exp2) * Math.cos(angle2);
    }
  }

  return { x, y, z };
};

const addLabels = (text) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const width = canvas.width = 512;
  const height = canvas.height = 128;
  context.fillStyle = 'white';
  context.clearRect(0, 0, width, height);
  context.fillStyle = 'black';
  context.font = '64px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.transparent = true;
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  return sprite;
};

const createLine = (start, end, scene) => {
  const material = new THREE.LineBasicMaterial({ color: 'black' });
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const line = new THREE.Line(geometry, material);
  scene.add(line);
};

const addReferenceCircle = (scene) => {
  const geometry = new THREE.RingGeometry(1.975, 2.025, 128);
  const material = new THREE.MeshBasicMaterial({ 
    color: 'black',
    side: THREE.DoubleSide, 
    transparent: true, 
    opacity: 0.5 
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.z = Math.PI / 2;
  scene.add(ring);
};

export const generateRadialLattice = (input, scene, spheresRef) => {
  if (!scene.userData.referenceCircleAdded) {
    addReferenceCircle(scene);
    scene.userData.referenceCircleAdded = true;
  }

  const ratioData = captureRatio(input);
  if (!ratioData) return;

  const { values: [numerator, denominator] } = ratioData;
  const factors = factorize(input);
  const position = computePosition(factors, input);

  if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
    console.error('Invalid position:', position);
    return;
  }

  const numeratorAnalysis = analyzeNumber(numerator);
  const isPrime = numeratorAnalysis.type === 'prime';
  const isPerfectPower = numeratorAnalysis.type === 'perfectPower';
  const isComposite = !isPrime && !isPerfectPower;

  const geometry = new THREE.SphereGeometry(0.2, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: '#B22222' });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(position.x, position.y, position.z);

  const label = addLabels(ratioData.string);
  label.position.set(position.x, position.y + 0.4, position.z);

  spheresRef.current.push({ sphere, label, position, numerator });

  scene.add(sphere);
  scene.add(label);

  if (isPrime) {
    createLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(position.x, position.y, position.z), scene);
  } 
  else if (isPerfectPower) {
    const base = numeratorAnalysis.base;
    const prevPower = numerator / base;

    const previousSphere = spheresRef.current.find((s) => s.numerator === prevPower);

    if (previousSphere) {
      createLine(
        new THREE.Vector3(previousSphere.position.x, previousSphere.position.y, previousSphere.position.z),
        new THREE.Vector3(position.x, position.y, position.z),
        scene
      );
    } else {
      createLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(position.x, position.y, position.z), scene);
    }
  } 
  else if (isComposite) {
    const primeFactors = Object.entries(factors)
      .filter(([_, exponent]) => exponent > 0)
      .map(([prime]) => parseInt(prime));

    primeFactors.forEach((prime) => {
      let primeSphere = spheresRef.current.find(({ numerator }) => numerator === prime);

      if (!primeSphere) {

        const closestPower = closestPowerOf2(prime);

        const primePosition = computePosition(factorize(`${prime}/${closestPower}`), `${prime}/${closestPower}`);
        const primeGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const primeMaterial = new THREE.MeshStandardMaterial({ color: '#B22222' });
        primeSphere = new THREE.Mesh(primeGeometry, primeMaterial);
        primeSphere.position.set(primePosition.x, primePosition.y, primePosition.z);

        const primeLabel = addLabels(`${prime}/${closestPower}`);
        primeLabel.position.set(primePosition.x, primePosition.y + 0.4, primePosition.z);

        spheresRef.current.push({ sphere: primeSphere, label: primeLabel, position: primePosition, numerator: prime });

        scene.add(primeSphere);
        scene.add(primeLabel);

        createLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(primeSphere.position.x, primeSphere.position.y, primeSphere.position.z), scene);
      }

      createLine(
        new THREE.Vector3(primeSphere.position.x, primeSphere.position.y, primeSphere.position.z),
        new THREE.Vector3(position.x, position.y, position.z),
        scene
      );
    });
  }
};

export const undoRadialLast = () => { };
