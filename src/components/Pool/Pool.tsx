import styles from './Pool.module.scss';
import * as THREE from 'three';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import { Vector3 } from 'three';
import { Vec3 } from 'cannon-es';

const Pool = () => {
	const rendererRef = useRef(null);
	const handleResize = useCallback((renderer: THREE.WebGLRenderer) => {
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, []);

	const clock = useMemo(() => new THREE.Clock(), []);

	// Returns an hit point if there's a hit with the mesh,
	// otherwise returns undefined
	const getHitPoint = (
		clientX: number,
		clientY: number,
		meshes: THREE.Mesh<THREE.SphereGeometry, THREE.MeshNormalMaterial>[],
		camera: THREE.PerspectiveCamera,
		raycaster: THREE.Raycaster
	): [number, Vector3, Vec3] => {
		// Get 3D point form the client x y
		const mouse = new THREE.Vector2();
		mouse.x = (clientX / window.innerWidth) * 2 - 1;
		mouse.y = -((clientY / window.innerHeight) * 2 - 1);

		// Get the picking ray from the point
		raycaster.setFromCamera(mouse, camera);

		// Find out if there's a hit
		let closest = Infinity;
		const closestPoint = new Vector3(0, 0, 0);
		let direction = new Vector3(0, 0, 0);
		let closestIdx = -1;
		for (let idx = 0; idx < meshes.length; idx++) {
			const currentHits = raycaster.intersectObject(meshes[idx]);
			if (currentHits.length > 0) {
				const dist = camera.position.distanceTo(currentHits[0].point);
				if (dist < closest) {
					closest = dist;
					closestIdx = idx;
					closestPoint.set(...currentHits[0].point.toArray());
					direction = new Vector3(0, 0, 0);
					direction.add(camera.position).sub(closestPoint).normalize();
				}
			}
		}

		// return idx of the closest sphere, -1 otherwise
		return [closestIdx, closestPoint, new Vec3(...direction.toArray())];
	};

	useEffect(() => {
		const canvas = rendererRef.current;

		const setup = async () => {
			// ------------------cannon-es------------
			const world = new CANNON.World({
				gravity: new CANNON.Vec3(0, -9.82, 0),
			});

			const groundMaterial = new CANNON.Material('ground');
			const groundBody = new CANNON.Body({
				type: CANNON.Body.STATIC,
				mass: 0,
				material: groundMaterial,
				shape: new CANNON.Plane(),
			});
			groundMaterial.friction = 10;
			groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
			groundBody.position.set(0, -13, 0);
			world.addBody(groundBody);

			const planeShapeXmin = new CANNON.Plane();
			const planeXmin = new CANNON.Body({ mass: 0, material: groundMaterial });
			planeXmin.addShape(planeShapeXmin);
			planeXmin.quaternion.setFromEuler(0, Math.PI / 2, 0);
			planeXmin.position.set(-25, 0, 0);
			world.addBody(planeXmin);

			// Plane +x
			const planeShapeXmax = new CANNON.Plane();
			const planeXmax = new CANNON.Body({ mass: 0, material: groundMaterial });
			planeXmax.addShape(planeShapeXmax);
			planeXmax.quaternion.setFromEuler(0, -Math.PI / 2, 0);
			planeXmax.position.set(25, 0, 0);
			world.addBody(planeXmax);

			const planeShapeZmin = new CANNON.Plane();
			const planeZmin = new CANNON.Body({ mass: 0, material: groundMaterial });
			planeZmin.addShape(planeShapeZmin);
			planeZmin.quaternion.setFromEuler(0, 0, 0);
			planeZmin.position.set(0, 0, -12.5);
			world.addBody(planeZmin);

			// Plane +z
			const planeShapeZmax = new CANNON.Plane();
			const planeZmax = new CANNON.Body({ mass: 0, material: groundMaterial });
			planeZmax.addShape(planeShapeZmax);
			planeZmax.quaternion.setFromEuler(0, Math.PI, 0);
			planeZmax.position.set(0, 0, 12.5);
			world.addBody(planeZmax);

			// Set up physics of a particular body
			const radius = 1; // m
			const numBodies = 20;

			const sphereBodies: CANNON.Body[] = [];
			const sphereMeshes: THREE.Mesh<THREE.SphereGeometry, THREE.MeshNormalMaterial>[] = [];

			for (let i = 0; i < numBodies; i++) {
				const sphereBody = new CANNON.Body({
					mass: 100, // kg
					shape: new CANNON.Sphere(radius),
					material: groundMaterial,
				});
				sphereBody.velocity = new CANNON.Vec3(
					Math.random() * 0.1 - 0.05,
					Math.random() * 0.1 - 0.05,
					Math.random() * 0.1 - 0.05
				);
				const x = (i % 4) * 2.5;
				const y = -1 * Math.floor(i / 4) * 2.5;
				sphereBody.position.set(x, y, 0);
				sphereBody.angularDamping = 0.3;
				sphereBody.linearDamping = 0.3;

				const geometry = new THREE.SphereGeometry(radius);
				const material = new THREE.MeshStandardMaterial();
				const sphereMesh = new THREE.Mesh(geometry, material);
				sphereMesh.castShadow = true;
				sphereMesh.receiveShadow = true;

				world.addBody(sphereBody);

				sphereMeshes.push(sphereMesh);
				sphereBodies.push(sphereBody);
			}

			const tableGeometry = new THREE.PlaneGeometry(50, 25);
			const tableTexture = new THREE.TextureLoader().load('table.png');
			const tableMaterial = new THREE.MeshStandardMaterial({
				map: tableTexture,
				side: THREE.DoubleSide,
			});
			const tablePlane = new THREE.Mesh(tableGeometry, tableMaterial);
			tablePlane.castShadow = true;
			tablePlane.receiveShadow = true;
			tablePlane.position.set(0, -13, 0);
			tablePlane.rotateX(Math.PI / 2);

			const geometryWoodLong = new THREE.BoxGeometry(50, 2, 1);
			const geometryWoodShort = new THREE.BoxGeometry(1, 2, 27);
			const textureWood = new THREE.TextureLoader().load('wood.jpg');
			const materialWood = new THREE.MeshStandardMaterial({
				map: textureWood,
				side: THREE.DoubleSide,
			});
			const woodPlane1 = new THREE.Mesh(geometryWoodLong, materialWood);
			const woodPlane2 = new THREE.Mesh(geometryWoodLong, materialWood);
			const woodPlane3 = new THREE.Mesh(geometryWoodShort, materialWood);
			const woodPlane4 = new THREE.Mesh(geometryWoodShort, materialWood);
			woodPlane1.castShadow = true;
			woodPlane1.receiveShadow = true;
			woodPlane2.castShadow = true;
			woodPlane2.receiveShadow = true;
			woodPlane3.castShadow = true;
			woodPlane3.receiveShadow = true;
			woodPlane4.castShadow = true;
			woodPlane4.receiveShadow = true;
			woodPlane1.position.set(0, -12.5, 13);
			woodPlane2.position.set(0, -12.5, -13);
			woodPlane3.position.set(25.5, -12.5, 0);
			woodPlane4.position.set(-25.5, -12.5, 0);

			const raycaster = new THREE.Raycaster();

			if (canvas !== null) {
				// ------------camera set up-----------------
				const camera = new THREE.PerspectiveCamera(
					60,
					window.innerWidth / window.innerHeight,
					0.01,
					10000
				);
				camera.position.set(3.75, 0, 5);

				const scene = new THREE.Scene();
				const skybox = new THREE.Mesh(
					new THREE.SphereGeometry(5000, 10, 10),
					new THREE.MeshBasicMaterial({
						map: new THREE.TextureLoader().load('/starmap_random_2020_4k.png'),
						side: THREE.BackSide,
					})
				);
				scene.add(skybox);

				const ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
				scene.add(ambientLight);

				const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
				const distance = 100;
				directionalLight1.position.set(-distance, distance, distance);
				directionalLight1.castShadow = true;
				directionalLight1.shadow.mapSize.width = 3000;
				directionalLight1.shadow.mapSize.height = 3000;
				directionalLight1.shadow.camera.left = -distance;
				directionalLight1.shadow.camera.right = distance;
				directionalLight1.shadow.camera.top = distance;
				directionalLight1.shadow.camera.bottom = -distance;
				directionalLight1.shadow.camera.far = 3 * distance;
				directionalLight1.shadow.camera.near = distance;

				const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.7);
				const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
				directionalLight2.copy(directionalLight1);
				directionalLight3.copy(directionalLight1);
				directionalLight2.position.set(distance, distance, -distance);
				directionalLight3.position.set(-distance, distance, -distance);

				scene.add(directionalLight1);
				scene.add(directionalLight2);
				scene.add(directionalLight3);

				sphereMeshes.map((sphereMesh) => {
					scene.add(sphereMesh);
				});

				scene.add(woodPlane1);
				scene.add(woodPlane2);
				scene.add(woodPlane3);
				scene.add(woodPlane4);
				scene.add(tablePlane);

				// Adds the skybox as a grid
				// const geometry = new THREE.SphereBufferGeometry(1000, 36, 18);
				// const material = new THREE.MeshBasicMaterial({
				// 	color: 0xc0c0c0,
				// 	wireframe: true,
				// 	opacity: 0.3,
				// });

				// const sphere = new THREE.Mesh(geometry, material);
				// scene.add(sphere);

				const renderer = new THREE.WebGLRenderer({ canvas: canvas });
				renderer.shadowMap.enabled = true;
				renderer.shadowMap.type = THREE.PCFSoftShadowMap;
				renderer.setPixelRatio(window.devicePixelRatio);
				renderer.setSize(window.innerWidth, window.innerHeight);

				window.addEventListener('resize', () => handleResize(renderer));

				const controls = new OrbitControls(camera, renderer.domElement);
				controls.target.set(3.75, -5, 0);

				// Click marker to be shown on interaction
				const markerGeometry = new THREE.SphereBufferGeometry(0.2, 8, 8);
				const markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
				const clickMarker = new THREE.Mesh(markerGeometry, markerMaterial);
				clickMarker.visible = false; // Hide it..
				scene.add(clickMarker);

				window.addEventListener('pointerdown', (event) => {
					// Cast a ray from where the mouse is pointing and
					// see if we hit something
					const [hitIdx, hitPoint, direction] = getHitPoint(
						event.clientX,
						event.clientY,
						sphereMeshes,
						camera,
						raycaster
					);

					// Return if the cube wasn't hit
					if (hitIdx === -1) {
						return;
					}

					// force applied needs to be in the direction that the camera is pointing
					const forceScale2 = 1;
					const [x2, y2, z2] = hitPoint.toArray();
					sphereBodies[hitIdx].applyForce(
						direction.scale(5000),
						// localVector
						new Vec3(x2 * forceScale2, y2 * forceScale2, z2 * forceScale2)
					);
				});

				const animate: FrameRequestCallback = () => {
					requestAnimationFrame(animate);
					renderer.render(scene, camera);
					sphereMeshes.map((sphereMesh, idx) => {
						sphereMesh.position.copy(
							new THREE.Vector3(...sphereBodies[idx].position.toArray())
						);
						sphereMesh.quaternion.copy(
							new THREE.Quaternion(...sphereBodies[idx].quaternion.toArray())
						);
					});

					controls.update();

					world.step(0.05);
				};
				// initiate first call to animation loop

				setTimeout(() => {
					animate(0);
				}, 1000);
			}
		};
		setup();
	}, [clock, handleResize]);

	return (
		<div className={styles.container}>
			<canvas ref={rendererRef} className={styles.canvas} />
		</div>
	);
};

export default Pool;
