from manim import *

class Scene_bab452a6_05c4_4253_9447_3b262207a7e2(Scene):
    def construct(self):
        equation = MathTex("ammu^2", "+", "bacchi^2", "=", "pony^2")
        equation.set_color(WHITE)
        self.camera.background_color = "#000000"
        self.play(Write(equation))
        self.wait(2)