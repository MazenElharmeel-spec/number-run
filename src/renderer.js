(() => {
  /** Canvas drawing and lightweight visual effects for the runner. */
  function createRenderer(canvas) {
    const context = canvas.getContext("2d", { alpha: false });
    const particles = [];

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let visualLane = 1;

    resize();
    window.addEventListener("resize", resize, { passive: true });

    function resize() {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function lanePosition(lane, progress) {
      const spread = width * 0.18 + width * 0.28 * progress ** 2;
      return width / 2 + (lane - 1) * spread;
    }

    function roundedRectangle(x, y, rectangleWidth, rectangleHeight, radius) {
      context.beginPath();
      context.roundRect(x, y, rectangleWidth, rectangleHeight, radius);
    }

    function burstAtLane(lane, color = "#9cf2ce") {
      const x = lanePosition(lane, 0.82);
      const y = height * 0.79;

      for (let index = 0; index < 14; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 30 + Math.random() * 150;

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 0.65,
          maxLife: 0.65,
          color,
        });
      }
    }

    function draw({ distance, gates, lane, state, dt, flash, shake }) {
      context.save();

      if (shake > 0) {
        context.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      drawBackground(distance);

      for (const gate of [...gates].sort((first, second) => second.z - first.z)) {
        drawGate(gate, lane);
      }

      drawRunner(lane, state, dt);
      drawParticles(dt);

      if (flash > 0) {
        context.fillStyle = `rgba(156, 242, 206, ${flash * 1.3})`;
        context.fillRect(0, 0, width, height);
      }

      context.restore();
    }

    function drawBackground(distance) {
      const centerX = width / 2;
      const horizon = height * 0.29;
      const trackTopLeft = width * 0.34;
      const trackTopRight = width * 0.66;
      const trackBottomLeft = width * 0.035;
      const trackBottomRight = width * 0.965;

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#07131c");
      sky.addColorStop(0.36, "#26353a");
      sky.addColorStop(0.61, "#142126");
      sky.addColorStop(1, "#070d12");
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      drawTunnelWalls(centerX, horizon, trackTopLeft, trackTopRight, trackBottomLeft, trackBottomRight);
      drawTunnelRibs(centerX, horizon);
      drawTrack(horizon, trackTopLeft, trackTopRight, trackBottomLeft, trackBottomRight, distance);
      drawPlatformLights(horizon, trackTopLeft, trackTopRight, trackBottomLeft, trackBottomRight, distance);
      drawVignette(centerX);
    }

    function drawTunnelWalls(centerX, horizon, topLeft, topRight, bottomLeft, bottomRight) {
      context.fillStyle = "#071016";
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(width, 0);
      context.lineTo(width, horizon);
      context.quadraticCurveTo(centerX, horizon - height * 0.12, 0, horizon);
      context.closePath();
      context.fill();

      context.fillStyle = "#273438";
      context.beginPath();
      context.moveTo(0, horizon * 0.45);
      context.lineTo(topLeft, horizon);
      context.lineTo(bottomLeft, height);
      context.lineTo(0, height);
      context.closePath();
      context.fill();

      context.fillStyle = "#202d32";
      context.beginPath();
      context.moveTo(width, horizon * 0.45);
      context.lineTo(topRight, horizon);
      context.lineTo(bottomRight, height);
      context.lineTo(width, height);
      context.closePath();
      context.fill();

      for (let side = 0; side < 2; side += 1) {
        const edge = side ? width : 0;
        const top = side ? topRight : topLeft;
        const bottom = side ? bottomRight : bottomLeft;

        context.strokeStyle = "#9aa79a25";
        context.lineWidth = 1;

        for (let index = 0; index < 7; index += 1) {
          const progress = index / 7;
          const y = horizon + (height - horizon) * progress ** 2;
          const x = top + (bottom - top) * progress ** 2;

          context.beginPath();
          context.moveTo(edge, y);
          context.lineTo(x, y);
          context.stroke();
        }

        for (let index = 0; index < 6; index += 1) {
          const progress = (index + 1) / 7;
          const y = horizon + (height - horizon) * progress ** 2;
          const x = side ? width - (width - topRight) * progress : topLeft * progress;

          context.fillStyle = index % 2 ? "#a8b2a915" : "#030a0d24";
          context.fillRect(side ? x : 0, y, side ? width - x : x, Math.max(1, 2 + progress * 3));
        }
      }
    }

    function drawTunnelRibs(centerX, horizon) {
      for (let index = 0; index < 11; index += 1) {
        const progress = (index + 1) / 11;
        const y = horizon + (height - horizon) * progress ** 2;
        const spread = width * 0.72 * progress;

        context.strokeStyle = `rgba(177, 197, 179, ${0.09 + progress * 0.08})`;
        context.lineWidth = 1 + progress * 2;
        context.beginPath();
        context.moveTo(centerX - spread, horizon - 12);
        context.quadraticCurveTo(centerX - spread * 0.79, y, centerX - spread * 0.28, y + 20 * progress);
        context.moveTo(centerX + spread, horizon - 12);
        context.quadraticCurveTo(centerX + spread * 0.79, y, centerX + spread * 0.28, y + 20 * progress);
        context.stroke();

        if (index % 2 === 0) {
          drawTunnelLamp(centerX - spread * 0.75, y, progress);
          drawTunnelLamp(centerX + spread * 0.75, y, progress);
        }
      }
    }

    function drawTunnelLamp(x, y, progress) {
      context.shadowColor = "#ffc879";
      context.shadowBlur = 12 * progress;
      context.fillStyle = "#ffd58b";
      context.fillRect(x - 3 * progress, y - 3 * progress, 6 * progress, 3 * progress);
      context.shadowBlur = 0;
    }

    function drawTrack(horizon, topLeft, topRight, bottomLeft, bottomRight, distance) {
      const trackGradient = context.createLinearGradient(0, horizon, 0, height);
      trackGradient.addColorStop(0, "#1b292c");
      trackGradient.addColorStop(0.5, "#10191d");
      trackGradient.addColorStop(1, "#20282a");

      context.fillStyle = trackGradient;
      context.beginPath();
      context.moveTo(topLeft, horizon);
      context.lineTo(topRight, horizon);
      context.lineTo(bottomRight, height);
      context.lineTo(bottomLeft, height);
      context.closePath();
      context.fill();

      drawSleepers(horizon, topLeft, topRight, bottomLeft, bottomRight, distance);
      drawRails(horizon, topLeft, topRight, bottomLeft, bottomRight);
    }

    function drawSleepers(horizon, topLeft, topRight, bottomLeft, bottomRight, distance) {
      for (let index = 0; index < 24; index += 1) {
        const progress = (index / 24 + (distance * 0.018) % 1) % 1;
        const perspective = progress ** 2;
        const y = horizon + (height - horizon) * perspective;
        const left = topLeft + (bottomLeft - topLeft) * perspective;
        const right = topRight + (bottomRight - topRight) * perspective;

        context.strokeStyle = `rgba(113, 132, 126, ${0.24 + 0.45 * progress})`;
        context.lineWidth = 1 + progress * 13;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(right, y);
        context.stroke();

        context.strokeStyle = `rgba(5, 10, 13, ${0.3 + 0.28 * progress})`;
        context.lineWidth = 1 + progress * 4;
        context.beginPath();
        context.moveTo(left, y + 1 + progress * 2);
        context.lineTo(right, y + 1 + progress * 2);
        context.stroke();
      }
    }

    function drawRails(horizon, topLeft, topRight, bottomLeft, bottomRight) {
      for (let index = 0; index < 6; index += 1) {
        const position = index / 5;
        const topX = topLeft + (topRight - topLeft) * position;
        const bottomX = bottomLeft + (bottomRight - bottomLeft) * position;

        context.strokeStyle = "#68797b";
        context.lineWidth = 1 + 5 * (index === 0 || index === 5 ? 1 : 0.7);
        context.beginPath();
        context.moveTo(topX, horizon);
        context.lineTo(bottomX, height);
        context.stroke();

        context.strokeStyle = "#d5dfd080";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(topX - 1, horizon);
        context.lineTo(bottomX - 5, height);
        context.stroke();
      }
    }

    function drawPlatformLights(horizon, topLeft, topRight, bottomLeft, bottomRight, distance) {
      for (let index = 0; index < 12; index += 1) {
        const progress = (index / 12 + distance * 0.014) % 1;
        const perspective = progress ** 2;
        const y = horizon + (height - horizon) * perspective;
        const left = topLeft + (bottomLeft - topLeft) * perspective;
        const right = topRight + (bottomRight - topRight) * perspective;
        const size = 2 + progress * 8;

        context.shadowColor = "#88f4c4";
        context.shadowBlur = 3 + progress * 8;
        context.fillStyle = `rgba(135, 245, 198, ${0.35 + 0.55 * progress})`;
        context.fillRect(left - size * 2, y, size, size * 0.33);
        context.fillRect(right + size, y, size, size * 0.33);
        context.shadowBlur = 0;
      }
    }

    function drawVignette(centerX) {
      const vignette = context.createRadialGradient(
        centerX,
        height * 0.5,
        height * 0.12,
        centerX,
        height * 0.52,
        Math.max(width, height) * 0.78,
      );
      vignette.addColorStop(0.2, "#00110b00");
      vignette.addColorStop(1, "#02070bcc");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
    }

    function drawGate(gate, selectedLane) {
      const progress = 1 - Math.max(0, gate.z) / 1600;
      if (progress < 0 || progress > 1.1) return;

      const y = height * 0.29 + height * 0.7 * progress ** 2;
      const scale = 0.28 + 0.9 * progress;
      const leftLaneX = lanePosition(0, progress);
      const laneSpacing = (lanePosition(2, progress) - leftLaneX) / 2;

      for (let lane = 0; lane < 3; lane += 1) {
        const x = leftLaneX + laneSpacing * lane;
        const gateWidth = Math.max(78, Math.min(174, width * 0.32)) * scale;
        const gateHeight = 45 * scale;
        const isSelected = gate.chosen && gate.selected === lane;

        drawGatePillar(x, y, gateWidth, gateHeight, progress);

        context.save();
        context.translate(x, y);
        context.shadowColor = isSelected ? "#a5ffd9" : "#ffb96b";
        context.shadowBlur = (isSelected ? 28 : 14) * scale;
        roundedRectangle(-gateWidth / 2, -gateHeight / 2, gateWidth, gateHeight, 7 * scale);

        const gateGradient = context.createLinearGradient(0, -gateHeight / 2, 0, gateHeight / 2);
        gateGradient.addColorStop(0, isSelected ? "#c4ffe3" : "#ffd38a");
        gateGradient.addColorStop(0.14, isSelected ? "#71d9b4" : "#d88a49");
        gateGradient.addColorStop(1, isSelected ? "#143a35" : "#352921");

        context.fillStyle = gateGradient;
        context.fill();
        context.lineWidth = Math.max(1, 2 * scale);
        context.strokeStyle = isSelected ? "#e8fff5" : "#ffe0ad";
        context.stroke();

        roundedRectangle(
          -gateWidth / 2 + 4 * scale,
          -gateHeight / 2 + 4 * scale,
          gateWidth - 8 * scale,
          gateHeight - 8 * scale,
          5 * scale,
        );
        context.fillStyle = isSelected ? "#0a2b27" : "#171d20";
        context.fill();

        context.fillStyle = isSelected ? "#c7ffe7" : "#fff1d3";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `700 ${Math.max(14, 28 * scale)}px ui-monospace, SFMono-Regular, monospace`;
        context.fillText(String(gate.choices[lane].answer), 0, 0, gateWidth - 12 * scale);
        context.restore();
      }
    }

    function drawGatePillar(x, y, gateWidth, gateHeight, progress) {
      context.fillStyle = "#10191b";
      context.globalAlpha = 0.92;
      context.fillRect(
        x - gateWidth * 0.42,
        y + gateHeight * 0.45,
        gateWidth * 0.84,
        Math.max(8, 38 * progress),
      );
      context.globalAlpha = 1;
    }

    function drawRunner(lane, state, dt) {
      visualLane += (lane - visualLane) * Math.min(1, dt * 13);

      const x = lanePosition(visualLane, 0.82);
      const y = height * 0.79;
      const scale = Math.min(1, width / 700);
      const phase = performance.now() * 0.018;
      const bob = state === "playing" ? Math.abs(Math.sin(phase)) * 4 : 0;
      const stride = state === "playing" ? Math.sin(phase) * 7 : 0;

      context.save();
      context.translate(x, y);
      context.scale(scale, scale);

      context.fillStyle = "#0008";
      context.beginPath();
      context.ellipse(0, 31, 28, 8, 0, 0, Math.PI * 2);
      context.fill();

      drawRunnerHead(bob);
      drawRunnerBody(bob, stride);
      drawRunnerLimbs(bob, stride);

      context.restore();
    }

    function drawRunnerHead(bob) {
      context.shadowColor = "#64eac0";
      context.shadowBlur = 12;
      context.fillStyle = "#e6b982";
      context.beginPath();
      context.arc(0, -26 + bob, 9, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      context.fillStyle = "#20272b";
      context.beginPath();
      context.arc(0, -29 + bob, 9, Math.PI, Math.PI * 2);
      context.fill();
    }

    function drawRunnerBody(bob) {
      context.fillStyle = "#f0924f";
      context.beginPath();
      context.roundRect(-10, -17 + bob, 20, 29, 6);
      context.fill();

      context.fillStyle = "#27333a";
      context.beginPath();
      context.roundRect(6, -14 + bob, 10, 19, 4);
      context.fill();
    }

    function drawRunnerLimbs(bob, stride) {
      context.strokeStyle = "#e9bc90";
      context.lineWidth = 5;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(-6, -9 + bob);
      context.lineTo(-13 - stride * 0.45, 3 + bob);
      context.moveTo(6, -10 + bob);
      context.lineTo(13 + stride * 0.45, -2 + bob);
      context.stroke();

      context.strokeStyle = "#22292d";
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(-5, 9 + bob);
      context.lineTo(-9 + stride, 25 + bob);
      context.moveTo(5, 9 + bob);
      context.lineTo(8 - stride, 25 + bob);
      context.stroke();

      context.strokeStyle = "#f4e6ce";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(-9 + stride, 25 + bob);
      context.lineTo(-14 + stride, 26 + bob);
      context.moveTo(8 - stride, 25 + bob);
      context.lineTo(13 - stride, 26 + bob);
      context.stroke();
    }

    function drawParticles(dt) {
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 65 * dt;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        context.globalAlpha = particle.life / particle.maxLife;
        context.fillStyle = particle.color;
        context.fillRect(particle.x, particle.y, 3, 3);
      }

      context.globalAlpha = 1;
    }

    return {
      burstAtLane,
      draw,
    };
  }

  window.NumberRunRenderer = { createRenderer };
})();
