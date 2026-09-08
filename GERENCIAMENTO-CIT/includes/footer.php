   </section><!-- Footer -->
   <footer class="gradient-dark-ifro text-white py-16 px-4">
    <div class="max-w-7xl mx-auto">
     <div class="grid md:grid-cols-4 gap-8 mb-8">
      <div>
       <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
         <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewbox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
         </svg>
        </div>
        <div>
         <span id="footer-title" class="font-black text-lg">CIT IFRO</span> <span id="footer-institution" class="text-xs text-green-300 block font-bold"><?= e(INSTITUTION_NAME) ?></span>
        </div>
       </div>
       <p class="text-sm text-green-100">Sistema inteligente de agendamento para o Centro de Informática e Tecnologia(CIT).</p>
      </div>
      <div>
       <h4 class="font-bold mb-4 text-lg">Links Rápidos</h4>
       <ul class="space-y-2 text-sm text-green-100">
        <li><a href="#inicio" class="hover:text-white transition-colors font-medium">Início</a></li>
        <li><a href="#como-funciona" class="hover:text-white transition-colors font-medium">Como Funciona</a></li>
        <li><a href="#calendario" class="hover:text-white transition-colors font-medium">Calendário</a></li>
        <li><a href="#inteligencia" class="hover:text-white transition-colors font-medium">Inteligência</a></li>
       </ul>
      </div>
      <div>
       <h4 class="font-bold mb-4 text-lg">Administração</h4>
       <ul class="space-y-2 text-sm text-green-100">
        <li><a href="#admin" class="hover:text-white transition-colors font-medium">Área Administrativa</a></li>
        <li><a href="#relatorios" class="hover:text-white transition-colors font-medium">Relatórios</a></li>
        <li><a href="#contato" class="hover:text-white transition-colors font-medium">Suporte</a></li>
       </ul>
      </div>
      <div>
       <h4 class="font-bold mb-4 text-lg">Horário de Funcionamento</h4>
       <ul class="space-y-2 text-sm text-green-100">
        <li class="font-medium">Segunda a Sexta: 08h - 22:50h</li>
        <li class="font-medium">Sábado: Fechado</li>
        <li class="font-medium">Domingo: Fechado</li>
       </ul>
      </div>
     </div>
     <div class="border-t-2 border-green-400 pt-8 text-center text-sm text-green-100">
      <p class="font-medium">© 2026 Sistema de Agendamento CIT - Instituto Federal de Rondônia. Todos os direitos reservados.</p>
     </div>
    </div>
   </footer><!-- Rejection Reason Modal -->
   <div id="rejection-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border-2 border-red-200">
     <div class="flex items-center justify-between mb-5">
      <h3 class="text-xl font-bold text-gray-800">Justificar recusa</h3><button type="button" onclick="closeRejectionModal()" class="p-2 hover:bg-red-50 rounded-lg" aria-label="Fechar">✕</button>
     </div>
     <p class="text-sm text-gray-600 mb-4">Explique ao solicitante por que este agendamento foi recusado.</p><label for="rejection-reason" class="block text-sm font-bold text-gray-700 mb-2">Motivo da recusa</label> <textarea id="rejection-reason" rows="4" required placeholder="Ex.: Sala reservada para manutenção no período informado." class="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 font-medium"></textarea>
     <div class="flex gap-3 mt-5">
      <button type="button" onclick="closeRejectionModal()" class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50">Cancelar</button> <button type="button" id="confirm-rejection-btn" onclick="confirmRejection()" class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Confirmar recusa</button>
     </div>
     <p id="rejection-note" class="mt-3 text-xs text-red-700 font-medium"></p>
    </div>
   </div><!-- Toast Notification -->
   <div id="toast" class="fixed bottom-4 right-4 gradient-ifro text-white px-6 py-3 rounded-lg shadow-xl transform translate-y-20 opacity-0 transition-all duration-300 z-50 font-bold border-2 border-green-300">
    <span id="toast-message"></span>
   </div>
  </div>
  <script>
    /**
     * Configuração vinda do servidor (config.php), consumida por
     * assets/js/script.js em applyConfig(). Mantém a fonte da verdade
     * dos textos institucionais no PHP, em vez de duplicá-los no JS.
     */
    window.SERVER_CONFIG = <?php echo json_encode([
        'site_title'       => SITE_TITLE,
        'institution_name' => INSTITUTION_NAME,
        'contact_email'    => CONTACT_EMAIL,
        'contact_phone'    => CONTACT_PHONE,
    ], JSON_UNESCAPED_UNICODE); ?>;
  </script>
  <script src="assets/js/script.js"></script>
 </body>
</html>
