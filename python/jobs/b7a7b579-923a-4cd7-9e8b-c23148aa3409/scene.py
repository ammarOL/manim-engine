from manim import *

class Scene_b7a7b579_923a_4cd7_9e8b_c23148aa3409(Scene):
    def construct(self):
        equation = MathTex("a^2", "+", "b^2", "=", "c^2")
        equation.set_color(WHITE)
        self.camera.background_color = "#000000"
        self.play(Write(equation))
        self.wait(2)